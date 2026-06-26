
from pathlib import Path
from playwright.sync_api import sync_playwright
html_file = Path('/mnt/data/game_pescaria_mapa_restaurado_testado_work/game-pescaria/game-pescaria/index.html').resolve()
url = html_file.as_uri()
with sync_playwright() as p:
    browser = p.chromium.launch(headless=True, executable_path='/usr/bin/chromium', args=['--no-sandbox'])
    page = browser.new_page(viewport={"width": 390, "height": 844})
    page.goto(url, wait_until='domcontentloaded')
    page.wait_for_timeout(1500)
    page.evaluate("showMapScreen && showMapScreen()")
    page.wait_for_timeout(300)

    shop = page.locator("#mapShopBtn").bounding_box()
    play = page.locator("#mapPlayBtn").bounding_box()
    assert shop and play, "map buttons missing"

    page.mouse.click(shop["x"] + shop["width"]/2, shop["y"] + shop["height"]/2)
    page.wait_for_timeout(500)
    assert not page.locator("#shopOverlay").evaluate("el => el.classList.contains('hidden')"), "shop did not open"
    assert page.locator("#preLevelOverlay").evaluate("el => el.classList.contains('hidden')"), "prelevel opened when clicking shop"

    page.locator("#shopCloseBtn").click()
    page.wait_for_timeout(500)
    assert not page.locator("#mapOverlay").evaluate("el => el.classList.contains('hidden')"), "map not visible after closing shop"
    assert page.locator("#preLevelOverlay").evaluate("el => el.classList.contains('hidden')"), "prelevel opened after closing shop"

    play = page.locator("#mapPlayBtn").bounding_box()
    page.mouse.click(play["x"] + play["width"]/2, play["y"] + play["height"]/2)
    page.wait_for_timeout(500)
    assert not page.locator("#preLevelOverlay").evaluate("el => el.classList.contains('hidden')"), "prelevel did not open on play"
    assert page.locator("#shopOverlay").evaluate("el => el.classList.contains('hidden')"), "shop opened on play"

    page.locator("#preLevelBackBtn").click()
    page.wait_for_timeout(300)
    assert not page.locator("#mapOverlay").evaluate("el => el.classList.contains('hidden')"), "back did not return map"

    page.evaluate('''() => {
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
    }''')
    rows = page.locator("#mapRankingList .ranking-item").count()
    assert rows == 5, f"ranking rows: {rows}"
    browser.close()
print('browser ok')
