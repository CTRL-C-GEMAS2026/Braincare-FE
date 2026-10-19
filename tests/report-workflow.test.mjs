import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile, mkdir, writeFile } from 'node:fs/promises';
import { execFileSync } from 'node:child_process';
import { chromium } from 'playwright';

const fixtureFile = process.env.BRAINCARE_E2E_FIXTURE;
test('doctor edits, finalizes, downloads and reopens a real report', { skip: !fixtureFile, timeout: 120000 }, async () => {
  const fixture = JSON.parse(await readFile(fixtureFile, 'utf8'));
  const artifacts = process.env.BRAINCARE_E2E_ARTIFACTS;
  assert.ok(artifacts, 'Set BRAINCARE_E2E_ARTIFACTS to a directory outside the repository');
  await mkdir(artifacts, { recursive: true });
  const browser = await chromium.launch({ headless: true, args: ['--no-sandbox'] });
  const page = await browser.newPage({ viewport: { width: 1920, height: 1080 }, acceptDownloads: true });
  const errors = [];
  page.on('pageerror', (err) => errors.push(String(err)));
  try {
    await page.goto(process.env.BRAINCARE_E2E_URL + '/login');
    const loginForm = page.locator('form').filter({ hasText: 'Masuk ke akun Anda' });
    await loginForm.locator('input[type="email"]').fill(fixture.email);
    await loginForm.locator('input[type="password"]').fill(fixture.password);
    await loginForm.getByRole('button', { name: 'Masuk', exact: true }).click();
    await page.waitForURL('**/dashboard');
    await page.goto(process.env.BRAINCARE_E2E_URL + '/viewer/' + fixture.caseId);
    await page.getByTestId('volume-WT').waitFor();
    assert.equal(await page.getByTestId('volume-WT').textContent(), fixture.measurements.regions.WT.volumeCm3.toLocaleString('id-ID', { minimumFractionDigits: 3, maximumFractionDigits: 3 }));
    assert.ok(await page.getByTestId('download-report').isDisabled());
    await page.screenshot({ path: artifacts + '/before-review.png', fullPage: true });

    const narrative = 'Laporan dokter untuk uji end-to-end. Temuan telah dicocokkan dengan citra.\nNarasi ini merupakan data dummy untuk pengujian.';
    await page.getByTestId('edit-narrative').click();
    await page.getByLabel('Sunting narasi laporan', { exact: true }).fill(narrative);
    assert.ok(await page.getByRole('button', { name: 'Setuju & Finalisasi' }).isDisabled());
    await page.getByRole('button', { name: 'Simpan narasi', exact: true }).click();
    await page.getByTestId('report-narrative').waitFor();
    assert.equal(await page.getByTestId('report-narrative').textContent(), narrative);
    await page.getByRole('button', { name: 'Setuju & Finalisasi' }).click();
    await page.getByRole('button', { name: 'Buka kembali' }).waitFor();
    assert.ok(await page.getByTestId('download-report').isEnabled());
    const downloadPromise = page.waitForEvent('download');
    await page.getByTestId('download-report').click();
    const download = await downloadPromise;
    await download.saveAs(artifacts + '/report-final.pdf');
    const text = execFileSync('pdftotext', [artifacts + '/report-final.pdf', '-'], { encoding: 'utf8' });
    assert.match(text, /Laporan dokter untuk uji end-to-end/);
    assert.match(text, /dr\. Dokter Uji Browser/);
    assert.match(text, /SIP-E2E/);
    assert.match(text, /FINAL/);
    await page.screenshot({ path: artifacts + '/finalized.png', fullPage: true });
    await page.setViewportSize({ width: 390, height: 844 });
    assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1), 'Mobile layout must not scroll horizontally');
    await page.screenshot({ path: artifacts + '/mobile.png', fullPage: true });
    await page.setViewportSize({ width: 1920, height: 1080 });

    await page.getByRole('button', { name: 'Buka kembali' }).click();
    await page.getByRole('button', { name: 'Setuju & Finalisasi' }).waitFor();
    assert.ok(await page.getByTestId('download-report').isDisabled());
    await page.locator('[data-testid="audit-history"] > summary').click();
    await page.getByText('Tinjauan dibuka kembali · revisi 4', { exact: true }).waitFor();
    await page.getByText('Laporan disetujui & difinalisasi · revisi 3', { exact: true }).waitFor();

    await page.getByRole('button', { name: 'Setuju & Finalisasi' }).click();
    await page.getByRole('button', { name: 'Buka kembali' }).waitFor();
    await page.getByTestId('edit-narrative').click();
    const localDraft = narrative + '\nPerubahan lokal yang belum tersimpan.';
    await page.getByLabel('Sunting narasi laporan', { exact: true }).fill(localDraft);
    const session = await page.evaluate(() => JSON.parse(localStorage.getItem('braincare_session')));
    const response = await fetch(process.env.BRAINCARE_E2E_API_URL + '/api/cases/' + fixture.caseId + '/narrative', {
      method: 'PATCH', headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + session.token },
      body: JSON.stringify({ narrative: 'Perubahan dari tab lain.', expectedRevision: 5 }),
    });
    assert.equal(response.status, 200);
    await page.getByRole('button', { name: 'Simpan narasi', exact: true }).click();
    await page.getByRole('alert').filter({ hasText: 'Laporan sudah berubah' }).waitFor();
    assert.equal(await page.getByLabel('Sunting narasi laporan', { exact: true }).inputValue(), localDraft);
    await page.getByRole('button', { name: 'Batal', exact: true }).click();
    await page.reload();
    await page.getByTestId('report-narrative').waitFor();
    assert.equal(await page.getByTestId('report-narrative').textContent(), 'Perubahan dari tab lain.');
    assert.ok(await page.getByTestId('download-report').isDisabled());
    await page.screenshot({ path: artifacts + '/reopened.png', fullPage: true });
    await page.emulateMedia({ media: 'print' });
    await page.pdf({ path: artifacts + '/unapproved-print-guard.pdf', format: 'A4' });
    const guardText = execFileSync('pdftotext', [artifacts + '/unapproved-print-guard.pdf', '-'], { encoding: 'utf8' });
    assert.match(guardText, /bukan laporan final/);
    assert.doesNotMatch(guardText, /Perubahan dari tab lain/);
    assert.deepEqual(errors, []);
    await writeFile(artifacts + '/result.json', JSON.stringify({ passed: true, login: true, volumetry: true, unsavedEditsBlockApproval: true, pdfDownload: true, reopenKeepsHistory: true, staleEditPreservesLocalDraft: true, printGuard: true, mobileLayout: true }, null, 2));
  } finally {
    await browser.close();
  }
});
