import time
from playwright.sync_api import sync_playwright

def run(playwright):
    browser = playwright.chromium.launch(headless=True)
    # Use desktop viewport
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

        # Click Next button (Desktop arrow)
        # Note: aria-label is "Next step"
        print("Looking for Next button...")
        next_btn = page.locator('button[aria-label="Next step"]')

        if next_btn.is_visible():
            print("Next button found. Clicking...")
            next_btn.click()
        else:
            print("Next button NOT found via aria-label.")
            # Try mobile button "Start Mediation" just in case viewport is weird
            mobile_btn = page.locator('button:has-text("Start Mediation")')
            if mobile_btn.is_visible():
                 print("Found mobile Start Mediation button. Clicking...")
                 mobile_btn.click()
            else:
                 print("No next button found at all!")
                 page.screenshot(path="no_next_btn.png")

        # Check if we moved to step 2
        try:
            page.wait_for_selector('text="Thoughts & Beliefs"', timeout=5000)
            print("Navigated to Step 2.")
            page.screenshot(path="step2_success.png")

            # Smart Suggestions Check
            # We need to fill "partyAThoughts" (Step 2 field)
            # Step 2 has 3 sub-steps (Thoughts, Emotions, Approach).
            # Thoughts is Sub-step 0.

            # SmartSuggestions checks "fieldType".
            # In StepContent (step 2), fieldType="thoughts" for partyAThoughts.

            print("Testing Smart Suggestions...")
            page.fill('textarea[id="partyAThoughts"]', "I feel frustrated")
            time.sleep(1) # Debounce

            suggestion_toggle = page.locator('button[aria-label="Show suggestions"]').first
            if suggestion_toggle.is_visible():
                print("Smart suggestions toggle visible.")
                suggestion_toggle.click()
                # Wait for suggestions
                page.wait_for_selector('button:has-text("I feel")', timeout=2000)
                print("Suggestions appeared.")
                page.screenshot(path="smart_suggestions_success.png")
            else:
                print("Smart suggestions toggle NOT visible.")
                page.screenshot(path="no_suggestions.png")

        except Exception as e:
            print(f"Did not navigate to Step 2: {e}")
            page.screenshot(path="step1_stuck.png")

    except Exception as e:
        print(f"Error: {e}")
    finally:
        browser.close()

with sync_playwright() as playwright:
    run(playwright)
