# Autoridades pendientes de confirmación

Estas 3 personas aparecen en la hoja **"Lista Oficial de Autoridades de Comité"** del Excel
solo como una nota secundaria (columna H/I, ej. "Jala más como mode..."), no como una fila
principal con rol confirmado. No tienen ninguna otra entrada (ni como delegado, ni paje, ni
asesor) en el resto del archivo. Por eso **no se generó credencial/QR para ellas** hasta
confirmar su rol oficial.

| Nombre | Comité | Email | Nota original en el Excel |
|---|---|---|---|
| Maria Luciana Tognarelli Pinto | Bosques | lucianatognarellip@gmail.com | "Jala más como mode" (junto a Danny Jheyson Montero Magne) |
| Rafaela Torrez | Consejo de Seguridad | rafaelatorrez21@gmail.com | "Jala más como mode" (junto a Jung Suh Alejandro de Padilla Copa) |
| Joaquín Ernesto Pardo Miranda | Bosques | joaquinepm2007@gmail.com | Sin nota, sin rol (junto a Miguel Ángel Ferreira Quinteros) |

Nota: Eduardo Pérez Vargas, que tenía la misma nota ambigua, **no** está en esta lista porque
ya tiene una entrada confirmada como delegado (Consejo de Seguridad Doble) — ese caso ya
quedó resuelto sin necesidad de confirmación.

## Qué hace falta

Confirmar el rol oficial de estas 3 personas (¿Presidencia / Moderación / Relatoría?) para
poder agregarlas a la base de datos y generarles su QR.

## Cómo cerrar esto

Una vez que tengan la respuesta, decirle a Claude el rol correcto de cada una (o que se
excluyen definitivamente) y se agregan a `participants` + se genera su PNG con
`scripts/generate_qrcodes.py`.
