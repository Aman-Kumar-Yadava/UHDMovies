import requests
from bs4 import BeautifulSoup
from urllib.parse import urljoin, urlparse
import sys
import re

def bypass_link_chain(start_url):
    session = requests.Session()
    
    # Spoofing a standard desktop browser to avoid basic bot blocks
    session.headers.update({
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
        'Connection': 'keep-alive',
        'Upgrade-Insecure-Requests': '1',
    })

    print("[*] Starting bypass chain...")
    
    try:
        response = session.get(start_url, timeout=15)
        response.raise_for_status()
        current_url = response.url
    except requests.exceptions.RequestException as e:
        print(f"[-] Failed to fetch initial URL: {e}")
        return
    
    step = 1
    
    # Loop through the forms until we hit the final page
    while True:
        soup = BeautifulSoup(response.text, 'html.parser')
        form = soup.find('form')
        
        # If there is no form, we've reached the final cookie/redirect page!
        if not form:
            print(f"\n[*] Reached the final stage at Step {step}!")
            print("[*] Hunting for the JavaScript cookie trap...")
            
            # Target the s_343('cookie_name', 'cookie_value', time) function directly
            regex_pattern = r"s_343\(\s*['\"]([^'\"]+)['\"]\s*,\s*['\"]([^'\"]+)['\"]"
            cookie_match = re.search(regex_pattern, response.text)
            
            if cookie_match:
                cookie_name = cookie_match.group(1)
                cookie_value = cookie_match.group(2)
                
                print(f"[*] Trap disarmed! Found Cookie: {cookie_name}")
                
                # Construct the hidden go_link since it isn't in the HTML DOM immediately
                go_link = f"https://cloud.unblockedgames.world/?go={cookie_name}"
                print(f"[*] Constructed Target Link: {go_link}")
                
                # Manually set the cookie in our Python session
                domain = urlparse(current_url).netloc
                session.cookies.set(cookie_name, cookie_value, domain=domain)
                
                print(f"[*] Following final redirect...")
                
                try:
                    # Update Referer so the server thinks we clicked the button naturally
                    session.headers.update({'Referer': current_url})
                    
                    # Follow the redirect to the final destination
                    final_response = session.get(go_link, allow_redirects=True, timeout=15)
                    actual_final_url = final_response.url
                    
                    # If the URL didn't change via HTTP 301/302, check for Meta/JS redirects
                    if actual_final_url == go_link:
                        print("[*] Server didn't use an HTTP redirect. Checking HTML for Meta/JS redirects...")
                        
                        # 1. Check for an HTML Meta Refresh tag
                        soup_final = BeautifulSoup(final_response.text, 'html.parser')
                        meta_refresh = soup_final.find('meta', attrs={'http-equiv': lambda x: x and x.lower() == 'refresh'})
                        
                        if meta_refresh:
                            content = meta_refresh.get('content', '')
                            # Extracts the URL from something like "0;url=https://drive.google.com/..."
                            match = re.search(r'url=([^\'"]+)', content, re.IGNORECASE)
                            if match:
                                actual_final_url = match.group(1)
                                print("[*] Found Meta Refresh redirect!")
                                
                        # 2. If no Meta tag, check for a JavaScript redirect
                        if actual_final_url == go_link:
                            js_redirect = re.search(r'window\.location\.(?:href|replace)\s*=\s*[\'"]([^\'"]+)[\'"]', final_response.text)
                            if js_redirect:
                                actual_final_url = js_redirect.group(1)
                                print("[*] Found JavaScript redirect!")

                    print("\n" + "="*60)
                    print(f"[-->] FINAL DESTINATION URL: {actual_final_url}")
                    print("="*60 + "\n")
                    
                except requests.exceptions.RequestException as e:
                    print(f"[-] Failed to follow final redirect: {e}")
            else:
                print("[-] Could not find the s_343 cookie script in the page source.")
                with open("debug_final.txt", "w", encoding="utf-8") as f:
                    f.write(response.text)
                print("[!] Saved the page HTML to 'debug_final.txt' for inspection.")
            break

        # Extract the action URL for the next POST request
        action_path = form.get('action')
        action_url = urljoin(current_url, action_path) if action_path else current_url
        
        # Extract all hidden cryptographic tokens
        payload = {}
        for input_tag in form.find_all('input', type='hidden'):
            name = input_tag.get('name')
            value = input_tag.get('value', '')
            if name:
                payload[name] = value
                
        print(f"\n[*] Step {step}: Found hidden form.")
        print("    - Smashing through (0s delay)...")
        
        try:
            # Update referer to maintain a natural session footprint
            session.headers.update({'Referer': current_url})
            
            # Submit the form to grab the NEXT page in the chain
            response = session.post(action_url, data=payload, timeout=15)
            response.raise_for_status()
            current_url = response.url
            step += 1
        except requests.exceptions.RequestException as e:
            print(f"[-] Request failed during step {step}: {e}")
            break

if __name__ == "__main__":
    print("=== Ultimate Link Bypass Script ===")
    user_url = input("Enter the starting URL: ").strip()
    
    if not user_url.startswith("http"):
        print("Invalid URL format. Please include http:// or https://")
        sys.exit(1)
        
    bypass_link_chain(user_url)
