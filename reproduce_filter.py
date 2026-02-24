from playwright.sync_api import Page, expect, sync_playwright

def reproduce_filtering(page: Page):
    page.goto("http://localhost:5173")

    # Open Modal
    page.get_by_title("Centrar Vista").click()
    page.wait_for_timeout(500)
    aegon_node = page.locator("div.rounded-xl", has_text="Aegon I").first
    aegon_node.locator("button.absolute.top-2.right-2").click(force=True)
    page.get_by_role("button", name="Hijo").click()

    # Enable Link Existing
    page.get_by_role("button", name="Vincular Existente").click()

    # Check initial state (Aenys I should be visible)
    expect(page.locator("div.custom-scrollbar").get_by_text("Aenys I", exact=True)).to_be_visible()

    # Type query "Visenya"
    page.locator("div.fixed.z-\\[100\\]").get_by_placeholder("Buscar personaje...").fill("Visenya")
    page.wait_for_timeout(500)

    # Verify "Visenya" is visible
    expect(page.locator("div.custom-scrollbar").get_by_text("Visenya", exact=True)).to_be_visible()

    # Verify "Aenys I" is NOT visible (Filtered out)
    # If the user says "ordenado al final", Aenys might still be there?
    if page.locator("div.custom-scrollbar").get_by_text("Aenys I", exact=True).is_visible():
        print("FAIL: Aenys I is still visible! Filtering failed.")
        page.screenshot(path="/home/jules/verification/filtering_failed.png")
        raise Exception("Filtering logic failed - non-matching item found.")
    else:
        print("PASS: Aenys I is hidden. Filtering works.")
        page.screenshot(path="/home/jules/verification/filtering_success.png")

if __name__ == "__main__":
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        try:
            reproduce_filtering(page)
        except Exception as e:
            print(f"Error: {e}")
        finally:
            browser.close()
