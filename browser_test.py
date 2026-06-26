
from pathlib import Path
from playwright.sync_api import sync_playwright

html_file = Path('/mnt/data/game_pescaria_mapa_restaurado_testado_work/game-pescaria/game-pescaria/index.html').resolve()
url = html_file.as_uri()

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    page = browser.new_page(viewport={"width": 390, "height": 844})
    page.goto(url)
    page.wait_for_timeout(1000)

    # Force map visible to test buttons, independent from intro button.
    page.evaluate("showMapScreen && showMapScreen()")
    page.wait_for_timeout(300)

    # Click LOJA button center and assert shop appears, prelevel does not.
    shop = page.locator("#mapShopBtn").bounding_box()
    play = page.locator("#mapPlayBtn").bounding_box()
    assert shop and play, "map buttons missing"
    page.mouse.click(shop["x"] + shop["width"]/2, shop["y"] + shop["height"]/2)
    page.wait_for_timeout(300)
    assert not page.locator("#shopOverlay").evaluate("el => el.classList.contains('hidden')"), "shop did not open"
    assert page.locator("#preLevelOverlay").evaluate("el => el.classList.contains('hidden')"), "prelevel opened when clicking shop"

    # Close shop and ensure it returns to map, not game.
    page.locator("#shopCloseBtn").click()
    page.wait_for_timeout(300)
    assert not page.locator("#mapOverlay").evaluate("el => el.classList.contains('hidden')"), "map not visible after closing shop"
    assert page.locator("#preLevelOverlay").evaluate("el => el.classList.contains('hidden')"), "prelevel opened after closing shop"

    # Click JOGAR and assert prelevel opens, shop does not.
    play = page.locator("#mapPlayBtn").bounding_box()
    page.mouse.click(play["x"] + play["width"]/2, play["y"] + play["height"]/2)
    page.wait_for_timeout(300)
    assert not page.locator("#preLevelOverlay").evaluate("el => el.classList.contains('hidden')"), "prelevel did not open on play"
    assert page.locator("#shopOverlay").evaluate("el => el.classList.contains('hidden')"), "shop opened on play"

    # Back button returns to map.
    page.locator("#preLevelBackBtn").click()
    page.wait_for_timeout(300)
    assert not page.locator("#mapOverlay").evaluate("el => el.classList.contains('hidden')"), "back button did not return to map"

    # Ranking renders max five rows when data inserted.
    page.evaluate("""
      localStorage.setItem('pescariaRanking', JSON.stringify([
        {date:'19/06/2026',score:142500},
        {date:'19/06/2026',score:96900},
        {date:'19/06/2026',score:77700},
        {date:'19/06/2026',score:34550},
        {date:'19/06/2026',score:19750},
        {date:'19/06/2026',score:12000}
      ]));
      showMapScreen();
      renderMapRanking();
    """)
    rows = page.locator("#mapRankingList .ranking-item").count()
    assert rows == 5, f"ranking rows: {rows}"
    browser.close()
print("browser ok")
