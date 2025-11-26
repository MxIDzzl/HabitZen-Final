# 🔍 TEST DEL SERVIDOR

## 📋 PASO 1: Verifica que el error sea específico

Abre la **Consola del navegador** (F12) y busca:

```
❌ ¿Dice "Invalid JWT"?
❌ ¿Dice "Failed to fetch"?
❌ ¿Dice "new row violates row-level security"?
❌ ¿Dice otro error?
```

**Copia el error COMPLETO y compártelo.**

---

## 📋 PASO 2: Verifica que el servidor esté desplegado

1. Abre: https://supabase.com/dashboard/project/sxjnlaoumttaglgbcyww/functions
2. ¿Ves la función "server" en la lista?
3. ¿Tiene un estado verde/activo?

---

## 📋 PASO 3: Prueba el endpoint manualmente

Abre la consola del navegador (F12) y pega esto:

```javascript
// Test del servidor
fetch('https://sxjnlaoumttaglgbcyww.supabase.co/functions/v1/make-server-5381f608/habits', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer dev-token-00000000-0000-0000-0000-000000000001'
  },
  body: JSON.stringify({
    title: 'Test Hábito',
    description: 'Prueba desde consola',
    category: 'test'
  })
})
.then(r => r.json())
.then(data => console.log('✅ RESPUESTA:', data))
.catch(err => console.error('❌ ERROR:', err));
```

**¿Qué respuesta te da?**

---

## 📋 POSIBLES PROBLEMAS:

### ❌ Si dice "Failed to fetch" o error de CORS:
**Causa:** El servidor no está desplegado o la URL es incorrecta

**Solución:** Ve a Supabase Functions y verifica que esté desplegado

---

### ❌ Si dice "Invalid JWT":
**Causa:** El código del servidor no se actualizó

**Solución:** Necesitas redesplegar el servidor con el código nuevo

---

### ❌ Si dice "row-level security policy":
**Causa:** El servidor no está usando SERVICE_ROLE_KEY

**Solución:** Verifica las variables de entorno del servidor

---

## 🎯 COMPARTE:

1. ✅ El error exacto de la consola
2. ✅ La respuesta del test manual (Paso 3)
3. ✅ Screenshot del error si es posible

Con esa info te doy la solución exacta. 🚀
