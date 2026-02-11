import time
from playwright.sync_api import sync_playwright

def run(playwright):
    browser = playwright.chromium.launch(headless=True)
    page = browser.new_page(viewport={'width': 1280, 'height': 800})
    try:
        page.goto("http://localhost:5173")
        page.wait_for_selector("h1", timeout=10000)

        # Fill fields
        print("Filling fields...")
        page.fill('input[id="partyAName"]', "Alice")
        page.fill('input[id="partyBName"]', "Bob")
        page.fill('textarea[id="conflictDescription"]', "Conflict")

        time.sleep(1)

        print("Checking Next button...")
        next_btn = page.locator('button:has-text("Next Step")')

        if next_btn.is_visible():
            print("Next button is visible.")
            if next_btn.is_enabled():
                print("Next button is enabled. Clicking...")
                next_btn.click()
                print("Clicked.")
            else:
                print("Next button is DISABLED.")
                page.screenshot(path="disabled_btn.png")
        else:
            print("Next button is NOT visible.")
            page.screenshot(path="invisible_btn.png")

        # Check if we moved to step 2
        try:
            page.wait_for_selector('text="Thoughts & Beliefs"', timeout=5000)
            print("Navigated to Step 2.")
            page.screenshot(path="step2_success.png")

            # Smart Suggestions Check
            page.fill('textarea[id="partyAThoughts"]', "I feel")
            time.sleep(1)

            suggestion_toggle = page.locator('button[aria-label="Show suggestions"]').first
            if suggestion_toggle.is_visible():
                print("Smart suggestions toggle visible.")
                suggestion_toggle.click()
                page.screenshot(path="smart_suggestions_success.png")
            else:
                print("Smart suggestions toggle NOT visible.")

        except:
            print("Did not navigate to Step 2.")

    except Exception as e:
        print(f"Error: {e}")
    finally:
        browser.close()

with sync_playwright() as playwright:
    run(playwright)
