import { test, expect } from '@playwright/test';
import { mockApi, session, routes } from './fixtures.js';

// Esta suite comprueba la SPA real de XTest con APIs controladas.
// No demuestra persistencia MongoDB ni transacciones/holds reales.

test('XT-E2E-01 | portada pública abre el acceso actual', async ({page}) => {
  await mockApi(page);
  await page.goto('/');
  await expect(page.getByRole('link',{name:'Ya tengo cuenta'})).toBeVisible();
  await page.getByRole('link',{name:'Ya tengo cuenta'}).click();
  await expect(page).toHaveURL(/\/login$/);
  await expect(page.getByRole('heading',{name:'Iniciar sesión'})).toBeVisible();
});

test('XT-E2E-02 | el guard de boletos exige autenticación', async ({page}) => {
  await mockApi(page);
  await page.goto('/boletos');
  await expect(page).toHaveURL(/\/login$/);
});

test('XT-E2E-03 | login inválido presenta error controlado', async ({page}) => {
  await mockApi(page,{rejectLogin:true});
  await page.goto('/login');
  await page.locator('#identificacion').fill('0999999999');
  await page.locator('#password').fill('clave-no-valida');
  await page.getByRole('button',{name:'Entrar'}).click();
  await expect(page.getByText('Credenciales incorrectas')).toBeVisible();
  expect(await page.evaluate(() => localStorage.getItem('token'))).toBeNull();
});

test('XT-E2E-04 | viajes: búsqueda rápida filtra rutas por ciudad', async ({page}) => {
  await session(page);
  await mockApi(page);
  await page.goto('/boletos');
  await expect(page.getByRole('heading',{name:'Comprar boletos'})).toBeVisible();
  await page.getByRole('button',{name:'Búsqueda rápida'}).click();
  await expect(page.locator('.ruta-fila')).toHaveCount(2);
  await page.locator('.compra-rapida').getByText('Desde').locator('..').locator('select').selectOption('Quito');
  await expect(page.locator('.ruta-fila')).toHaveCount(1);
  await expect(page.locator('.ruta-fila').first()).toContainText('Quito');
  await expect(page.locator('.ruta-fila').first()).toContainText('Guayaquil');
});

test('XT-E2E-05 | detalle del viaje permite abrir selección de asientos', async ({page}) => {
  await session(page);
  await mockApi(page);
  await page.goto('/boletos');
  await page.getByRole('button',{name:'Búsqueda rápida'}).click();
  const fila = page.locator('.ruta-fila').filter({hasText:'Guayaquil'}).first();
  await expect(fila).toContainText('$15');
  await fila.getByRole('button',{name:'Elegir'}).click();
  await expect(page).toHaveURL(/\/seat-booking\?/);
  await expect(page.getByRole('heading',{name:/Reserva de Asientos/})).toBeVisible();
});

test('XT-E2E-06 | turismo: filtro por nombre y ciudad', async ({page}) => {
  await session(page);
  await mockApi(page);
  await page.goto('/lugares-turisticos');
  await expect(page.getByRole('heading',{name:'Lugares turísticos'})).toBeVisible();
  await expect(page.locator('.lugar-card')).toHaveCount(2);
  await page.getByRole('searchbox',{name:'Buscar un lugar o ciudad'}).fill('Guayaquil');
  await expect(page.locator('.lugar-card')).toHaveCount(1);
  await expect(page.locator('.lugar-card')).toContainText('Malecón 2000');
});

test('XT-E2E-07 | recomendaciones turísticas presentan la puntuación', async ({page}) => {
  await session(page);
  await mockApi(page);
  await page.goto('/recomendados?ciudad=Guayaquil');
  await expect(page.getByRole('heading',{name:'Recomendados para ti en Guayaquil'})).toBeVisible();
  await expect(page.locator('.recomendado-card')).toHaveCount(1);
  await expect(page.locator('.recomendado-card')).toContainText('Malecón 2000');
  await expect(page.locator('.recomendado-card')).toContainText('4.70');
});
