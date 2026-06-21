# YouTube Cookie Generator for Automatizacion Video Viral
#
# This script helps you generate YouTube cookies for the pipeline.
# You need to run this on a machine where you're logged into YouTube in Chrome/Edge.
#
# How to use:
# 1. Make sure you're logged into YouTube in Chrome/Edge
# 2. Close ALL browser windows except one
# 3. Run this script from PowerShell as Administrator
# 4. The script will create cookies.txt in the current directory
# 5. Base64-encode the file and set it as YT_COOKIES GitHub secret

$cookiesFile = "$PWD\yt-cookies.txt"
$base64File = "$PWD\yt-cookies-base64.txt"

Write-Host "=== YouTube Cookie Generator ===" -ForegroundColor Cyan
Write-Host ""
Write-Host "Method 1: Manual export (recommended)" -ForegroundColor Yellow
Write-Host "  1. Install 'Get cookies.txt' Chrome extension:"
Write-Host "     https://chrome.google.com/webstore/detail/get-cookiestxt/bgaddhkoddajcdgocldbbfleckgcbcid"
Write-Host "  2. Visit https://www.youtube.com (must be logged in)"
Write-Host "  3. Click the extension icon -> Export"
Write-Host "  4. Save as '$cookiesFile'"
Write-Host ""
Write-Host "Method 2: Automatic extraction (if Chrome DevTools Protocol available)" -ForegroundColor Yellow
Write-Host "  This method tries to extract cookies from a running Chrome instance."
Write-Host ""

$choice = Read-Host "Enter method (1 for manual, 2 for automatic, or press Enter to skip)"

if ($choice -eq "2") {
    Write-Host "Attempting to extract cookies from Chrome..." -ForegroundColor Green
    try {
        $chromeProcess = Get-Process chrome -ErrorAction SilentlyContinue | Select-Object -First 1
        if (-not $chromeProcess) {
            Write-Host "Chrome is not running. Please open Chrome and log into YouTube first." -ForegroundColor Red
            exit 1
        }
        
        $port = 9222
        $startParams = @{
            FilePath = "chrome.exe"
            ArgumentList = "--remote-debugging-port=$port"
            PassThru = $true
        }
        
        Write-Host "Connecting to Chrome debugging port $port..." -ForegroundColor Green
        
        # Try to connect to Chrome DevTools
        $response = Invoke-RestMethod -Uri "http://localhost:$port/json" -ErrorAction SilentlyContinue
        if ($response) {
            $wsUrl = $response[0].webSocketDebuggerUrl
            Write-Host "Connected to Chrome. Extracting YouTube cookies..." -ForegroundColor Green
            
            # Use CDP to get cookies for YouTube
            $cdpResult = Invoke-RestMethod -Uri "http://localhost:$port/json" -Method GET
            if ($cdpResult) {
                Write-Host "Please visit https://www.youtube.com in the opened Chrome window."
                Read-Host "Press Enter after you're logged in"
                
                # This is a simplified approach - for full implementation,
                # we'd use WebSocket to communicate with CDP
                $cookiesUrl = "http://localhost:$port/json"
                Write-Host "Automatic extraction requires a WebSocket client." -ForegroundColor Yellow
                Write-Host "Falling back to manual method." -ForegroundColor Yellow
            }
        } else {
            Write-Host "Could not connect to Chrome debugging port." -ForegroundColor Red
            Write-Host "Please use Method 1 (manual export) instead." -ForegroundColor Yellow
        }
    } catch {
        Write-Host "Error: $_" -ForegroundColor Red
    }
}

if ($choice -eq "1" -or $choice -eq "") {
    if (Test-Path $cookiesFile) {
        Write-Host "Found existing cookies.txt!" -ForegroundColor Green
    } else {
        Write-Host ""
        Write-Host "Creating template cookies.txt (CONSENT cookie only - may not bypass bot detection)" -ForegroundColor Yellow
        $template = @"
# Netscape HTTP Cookie File
# https://curl.se/rfc/cookie_spec.html
.youtube.com	TRUE	/	TRUE	1767225600	CONSENT	YES+1
"@
        $template | Out-File -FilePath $cookiesFile -Encoding ascii
        Write-Host "Template created at: $cookiesFile" -ForegroundColor Green
        Write-Host "For real YouTube access, use Method 1 and replace this file." -ForegroundColor Yellow
    }
    
    if (Test-Path $cookiesFile) {
        $bytes = [System.IO.File]::ReadAllBytes($cookiesFile)
        $base64 = [Convert]::ToBase64String($bytes)
        $base64 | Out-File -FilePath $base64File -NoNewline
        Write-Host ""
        Write-Host "Base64-encoded cookies saved to: $base64File" -ForegroundColor Green
        Write-Host ""
        Write-Host "=== GitHub Secret Setup ===" -ForegroundColor Cyan
        Write-Host "Run this command:"
        Write-Host "  gh secret set YT_COOKIES < $base64File" -ForegroundColor White
        Write-Host ""
        Write-Host "Or manually copy the base64 string below:" -ForegroundColor Cyan
        Write-Host "$base64" -ForegroundColor White
    }
}

Write-Host ""
Write-Host "Done!" -ForegroundColor Cyan
