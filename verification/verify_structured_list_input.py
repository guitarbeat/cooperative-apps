from playwright.sync_api import sync_playwright, expect
import json
import time

def run(playwright):
    browser = playwright.chromium.launch(headless=True)
    page = browser.new_page()
    page.set_viewport_size({"width": 375, "height": 667}) # Mobile viewport

    page.goto("http://localhost:8080")

    # Inject data
    data = {
        "partyAName": "Alice",
        "partyBName": "Bob",
        "conflictDescription": "A conflict description that is long enough.",
        "dateOfIncident": "2023-01-01",
        "dateOfMediation": "2023-01-02",
        "locationOfConflict": "Office",
        "partyAThoughts": "Thoughts A",
        "partyAAssertiveApproach": "Approach A",
        "partyBThoughts": "Thoughts B",
        "partyBAssertiveApproach": "Approach B",
        "activatingEvent": "Event",
        "partyABeliefs": "Beliefs A",
        "partyBBeliefs": "Beliefs B",
        "partyAConsequences": "Consequences A",
        "partyBConsequences": "Consequences B",
        "partyADisputations": "Disputations A",
        "partyBDisputations": "Disputations B",
        "effectsReflections": "Reflections",
        "partyAMiracle": "Miracle A",
        "partyBMiracle": "Miracle B",
        "compromiseSolutions": "Compromise",
        "actionSteps": [],
        "followUpDate": "2023-02-01",
        "partyAColor": "#6B8E47",
        "partyBColor": "#0D9488"
    }

    page.evaluate("val => localStorage.setItem('mediation_form_v1', val)", json.dumps(data))
    page.reload()

    # Wait for app
    try:
        page.wait_for_selector("text=Co-op Conflict Resolution Platform", timeout=5000)
    except:
        print("App not loaded")
        browser.close()
        return

    print("Navigating...")

    for i in range(20):
        # Check if we see the form field
        if page.locator("#partyATop3Solutions").is_visible():
            print("Found input!")
            break

        # Click next (mobile button)
        try:
            # Scroll to bottom
            page.evaluate("window.scrollTo(0, document.body.scrollHeight)")

            # Wait for button to be stable
            page.wait_for_timeout(500)

            btn = page.locator("[data-testid='next-button']")
            if btn.is_visible():
                btn_text = btn.inner_text()
                print(f"Clicking {btn_text}")
                btn.click()
                # Wait for animation/transition
                page.wait_for_timeout(1000)
            else:
                print("Next button not visible")
        except Exception as e:
            print(f"Error clicking next: {e}")

    # Try finding the input again
    input_selector = "#partyATop3Solutions"
    try:
        page.wait_for_selector(input_selector, timeout=2000)
        print("Found input")

        # Scroll to it
        page.locator(input_selector).scroll_into_view_if_needed()

    except:
        print("Input not found after navigation loop")
        page.screenshot(path="verification/debug_nav_fail.png")
        browser.close()
        return

    # Add an item
    page.fill(input_selector, "Solution 1")

    # Click Add item button associated with this input
    add_btn = page.locator("div.flex.gap-2").filter(has=page.locator(input_selector)).get_by_label("Add item")

    print(f"Is disabled: {add_btn.is_disabled()}")

    # Try pressing Enter
    page.press(input_selector, "Enter")

    # Wait a bit
    page.wait_for_timeout(500)

    print(f"Input value after Enter: {page.input_value(input_selector)}")

    # Verify the item is added
    if page.get_by_text("Solution 1").is_visible():
        print("Item added successfully")
    else:
        print("Item NOT added")
        page.screenshot(path="verification/debug_add_fail.png")

    # Verify accessible buttons for the item
    edit_btn = page.get_by_label("Edit Solution 1")
    expect(edit_btn).to_be_visible()
    print("Found Edit button with accessible name")

    delete_btn = page.get_by_label("Delete Solution 1")
    expect(delete_btn).to_be_visible()
    print("Found Delete button with accessible name")

    check_btn = page.get_by_label("Mark Solution 1 as complete")
    expect(check_btn).to_be_visible()
    print("Found Check button with accessible name")

    # Scroll the list into view for screenshot
    page.get_by_text("Solution 1").scroll_into_view_if_needed()
    page.wait_for_timeout(500)

    # Take screenshot of the list with buttons
    page.screenshot(path="verification/structured_list_input.png")
    print("Verification complete")

    browser.close()

with sync_playwright() as playwright:
    run(playwright)
