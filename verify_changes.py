import time
from playwright.sync_api import sync_playwright

def run(playwright):
    browser = playwright.chromium.launch(headless=True)
    page = browser.new_page()
    try:
        page.goto("http://localhost:5173")

        # Wait for page to load
        page.wait_for_selector("h1", timeout=10000)

        # Step 1: Party Setup
        print("Taking screenshot of Step 1...")
        page.screenshot(path="step1.png")

        # Fill required fields to go to Step 2
        page.fill('input[id="partyAName"]', "Alice")
        page.fill('input[id="partyBName"]', "Bob")
        page.fill('textarea[id="conflictDescription"]', "Disagreement about project timeline.")

        # Navigate to Step 2
        # Click "Next" button
        page.click('button:has-text("Next Step")')

        # Wait for Step 2
        page.wait_for_selector('text="Thoughts & Beliefs"', timeout=5000)

        # Step 2: Smart Suggestions
        print("Taking screenshot of Step 2...")
        page.screenshot(path="step2.png")

        # Interact with Smart Suggestions
        # Try to find the toggle button. In origin/main it's a ChevronDown inside a button with aria-label="Show suggestions"
        # We need to type something first?
        # "Smart suggestions based on field type and content".
        # "if (suggestions.length === 0 && !isLoading) return null;"
        # So we need to type something to trigger suggestions?
        # Wait, the component says:
        # useEffect -> generateSuggestions if debouncedValue.length > 2
        # So yes, we need to type > 2 chars.

        page.fill('textarea[id="partyAThoughts"]', "I feel")
        time.sleep(1) # Wait for debounce (500ms) and generation

        # Now suggestions should be generated.
        # Toggle button should appear.

        suggestion_toggle = page.locator('button[aria-label="Show suggestions"]').first
        suggestion_toggle.wait_for(state="visible", timeout=5000)
        suggestion_toggle.click()

        # Wait for suggestions to appear
        page.wait_for_selector('button:has-text("I feel like my concerns")', timeout=2000)
        print("Taking screenshot of Smart Suggestions...")
        page.screenshot(path="smart_suggestions.png")

    except Exception as e:
        print(f"Error: {e}")
        page.screenshot(path="error.png")
    finally:
        browser.close()

with sync_playwright() as playwright:
    run(playwright)
