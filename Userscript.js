// ==UserScript==
// @name         UHDMOVIES Cloud Unblockedgames Auto-Bypass
// @namespace    http://tampermonkey.net/
// @version      1.0
// @description  Instantly bypass link shortener chains in the background
// @author       You
// @match        *://cloud.unblockedgames.world/*
// @run-at       document-start
// @grant        none
// ==/UserScript==

(async function() {
    'use strict';

    const urlParams = new URLSearchParams(window.location.search);

    // Only take over if we are starting a chain (?sid=)
    if (urlParams.has('sid')) {
        
        // 1. Halt the normal page load to block all ads and timers
        window.stop();
        
        // 2. Build a terminal-style UI to show progress
        document.documentElement.innerHTML = `
            <head><title>Bypassing Chain...</title></head>
            <body style="background-color: #0d1117; color: #58a6ff; font-family: 'Courier New', Courier, monospace; padding: 20px; line-height: 1.5;">
                <h2 style="color: #3fb950;">=== Ultimate Link Bypass Script (Web Version) ===</h2>
                <div id="log"></div>
            </body>
        `;

        const log = (msg, color = '#58a6ff') => {
            document.getElementById('log').innerHTML += `<div style="color: ${color};">${msg}</div>`;
        };

        let currentUrl = window.location.href;
        let step = 1;

        async function processChain(url, method = 'GET', body = null) {
            try {
                // Fetch the page silently in the background
                let response = await fetch(url, {
                    method: method,
                    body: body,
                    headers: body ? { 'Content-Type': 'application/x-www-form-urlencoded' } : {}
                });

                let text = await response.text();
                let responseUrl = response.url;
                
                let parser = new DOMParser();
                let doc = parser.parseFromString(text, 'text/html');
                let form = doc.querySelector('form');

                // 3. Process Hidden Forms
                if (form) {
                    log(`[*] Step ${step}: Found hidden form. Smashing through (0s delay)...`);
                    
                    let action = form.getAttribute('action') || responseUrl;
                    action = new URL(action, responseUrl).href;

                    // Scrape the payload tokens
                    let formData = new URLSearchParams();
                    form.querySelectorAll('input[type="hidden"]').forEach(input => {
                        formData.append(input.name, input.value);
                    });

                    step++;
                    await processChain(action, 'POST', formData);
                } 
                // 4. Handle the Final Stage
                else {
                    log(`<br>[*] Reached the final stage at Step ${step}!`);
                    log(`[*] Hunting for the JavaScript cookie trap...`, '#d2a8ff');

                    let cookieMatch = text.match(/s_343\(\s*['"]([^'"]+)['"]\s*,\s*['"]([^'"]+)['"]/);
                    
                    if (cookieMatch) {
                        let cookieName = cookieMatch[1];
                        let cookieValue = cookieMatch[2];
                        
                        log(`[*] Trap disarmed! Found Cookie: ${cookieName}`, '#3fb950');

                        // Set the cookie directly in the browser memory
                        document.cookie = `${cookieName}=${cookieValue}; path=/; domain=${window.location.hostname}`;
                        
                        let goLink = `https://${window.location.hostname}/?go=${cookieName}`;
                        log(`[*] Constructed Target Link: ${goLink}`);
                        log(`[*] Following final redirect...`);

                        // Fetch the final page
                        let finalRes = await fetch(goLink);
                        let finalText = await finalRes.text();
                        let actualFinalUrl = finalRes.url;

                        // 5. Parse Meta/JS Redirects
                        if (actualFinalUrl === goLink || actualFinalUrl.includes('?go=')) {
                            log(`[*] Server didn't use an HTTP redirect. Checking HTML for Meta/JS redirects...`);
                            
                            let finalDoc = parser.parseFromString(finalText, 'text/html');
                            let meta = finalDoc.querySelector('meta[http-equiv="refresh"]');
                            
                            if (meta) {
                                let match = meta.content.match(/url=([^'"]+)/i);
                                if (match) {
                                    actualFinalUrl = match[1];
                                    log(`[*] Found Meta Refresh redirect!`, '#3fb950');
                                }
                            } else {
                                let jsMatch = finalText.match(/window\.location\.(?:href|replace)\s*=\s*['"]([^'"]+)['"]/);
                                if (jsMatch) {
                                    actualFinalUrl = jsMatch[1];
                                    log(`[*] Found JavaScript redirect!`, '#3fb950');
                                }
                            }
                        }

                        log(`<br>============================================================`, '#ff7b72');
                        log(`[-->] FINAL DESTINATION URL: <a href="${actualFinalUrl}" style="color: #ff7b72;">${actualFinalUrl}</a>`, '#ff7b72');
                        log(`============================================================<br>`, '#ff7b72');
                        log(`[*] Teleporting you there in 2 seconds...`);

                        // Launch the final Google Drive page
                        setTimeout(() => {
                            window.location.href = actualFinalUrl;
                        }, 2000);

                    } else {
                        log(`[-] Could not find the s_343 cookie script. The site may have updated.`, '#f85149');
                    }
                }
            } catch (e) {
                log(`[-] Error during bypass: ${e.message}`, '#f85149');
            }
        }

        processChain(currentUrl);
    } 
    
    // Fallback logic: If you somehow land directly on the ?go= link manually
    else if (urlParams.has('go')) {
        let meta = document.querySelector('meta[http-equiv="refresh"]');
        if (meta) {
            let match = meta.content.match(/url=([^'"]+)/i);
            if (match) window.location.href = match[1];
        } else {
            let jsMatch = document.documentElement.innerHTML.match(/window\.location\.(?:href|replace)\s*=\s*['"]([^'"]+)['"]/);
            if (jsMatch) window.location.href = jsMatch[1];
        }
    }
})();

