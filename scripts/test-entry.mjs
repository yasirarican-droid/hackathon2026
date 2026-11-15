export async function finishFirstEntry(page) {
  await page.locator('#briefing-screen').waitFor({state:'visible',timeout:30000});
  await page.locator('#briefing-skip').click();
  await page.locator('#arrival-screen').waitFor({state:'visible'});
  await page.locator('#arrival-skip').click();
  await page.locator('#crt-intro-screen').waitFor({state:'visible'});
  await page.locator('#crt-intro-skip').click();
  await page.locator('#room-page').waitFor({state:'visible'});
}
