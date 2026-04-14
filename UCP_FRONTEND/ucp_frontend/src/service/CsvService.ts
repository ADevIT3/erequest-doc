export function exportDetailedRecapitulationCSV(
    data: any
) {

    const {
        categories,
        recapItems,
        totalMontant,
        title,
        activiteCode,
        activiteNom
    } = data;

    const rows: string[] = [];

    /* -------- TITLE -------- */

    if (title) {
        rows.push(title);
        rows.push("");
    }

    if (activiteCode && activiteNom) {
        rows.push(`Activité: ${activiteCode} - ${activiteNom}`);
        rows.push("");
    }

    /* =====================================
       CATEGORY TABLES
    ===================================== */

    for (const categorie of categories) {

        rows.push(categorie.nom.toUpperCase());

        const colonnes = categorie.categorieRubriqueColonnes;

        const headers = [
            "Rubrique",
            ...colonnes.map(col =>
                col.nom === "Unit"
                    ? "Unité"
                    : col.nom === "Total"
                        ? "Montant"
                        : col.nom === "Total_valide"
                            ? "Montant validé"
                            : col.nom
            )
        ];

        rows.push(headers.join(";"));

        for (const rubrique of categorie.rubriques) {

            if (!rubrique.requeteRubriques?.length) continue;

            const row: string[] = [rubrique.nom];

            for (const colonne of colonnes) {

                const rr = rubrique.requeteRubriques.find(
                    r =>
                        r.idCategorieRubriqueColonne ===
                        colonne.idCategorieRubriqueColonne
                );

                if (!rr) {
                    row.push("");
                    continue;
                }

                if (colonne.datatype === "float" || colonne.datatype === "nombre") {

                    const num = parseFloat(rr.valeur);

                    const formatted = isNaN(num)
                        ? "0"
                        : Math.round(num).toString();

                    row.push(formatted);

                } else if (colonne.datatype === "date") {

                    try {

                        const date = new Date(rr.valeur);

                        row.push(date.toLocaleDateString("fr-FR"));

                    } catch {

                        row.push(rr.valeur);
                    }

                } else {

                    row.push(rr.valeur);
                }
            }

            rows.push(row.join(";"));
        }

        rows.push("");
        rows.push("");
    }

    /* =====================================
       RECAP TABLE
    ===================================== */

    rows.push("RÉCAPITULATION");
    rows.push("DÉSIGNATION;MONTANT");

    for (const item of recapItems) {

        rows.push(
            `${item.designation};${Math.round(item.montant)}`
        );
    }

    rows.push(`TOTAL;${Math.round(totalMontant)}`);

    /* =====================================
       DOWNLOAD FILE
    ===================================== */

    const csvContent =
        "\uFEFF" + rows.join("\n"); // UTF-8 BOM for Excel

    const blob = new Blob([csvContent], {
        type: "text/csv;charset=utf-8;"
    });

    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");

    link.href = url;
    link.download = "recapitulation_detaillee.csv";

    document.body.appendChild(link);

    link.click();

    document.body.removeChild(link);
}