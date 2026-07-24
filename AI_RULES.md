# Reglas obligatorias para IA

1. Consumir el mínimo crédito posible.
2. Leer primero `PROJECT_BRIEF.md`.
3. Inspeccionar solo los archivos relacionados con la tarea.
4. Hacer una sola tarea cada vez.
5. Aplicar el cambio mínimo necesario.
6. No reescribir archivos completos si basta un cambio parcial.
7. No duplicar código.
8. No hacer refactorizaciones no solicitadas.
9. No modificar diseño, textos o funcionalidades ajenas a la tarea.
10. Reutilizar funciones, componentes y estilos existentes.
11. Ejecutar `npm run build` después de cambios de código.
12. No hacer push si el build falla.
13. Si el build funciona, ejecutar:

    ```bash
    git add .
    git commit -m "mensaje breve relacionado con la tarea"
    git push origin main
    ```

14. El push a `main` debe activar el despliegue automático de Vercel.
15. No instalar dependencias salvo necesidad real.
16. No mostrar explicaciones largas: responder solo con archivos modificados, build, commit y push.
17. No revelar, copiar ni modificar claves privadas.
