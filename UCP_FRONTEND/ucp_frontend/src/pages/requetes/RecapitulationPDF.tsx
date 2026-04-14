import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

export interface RecapItem {
    designation: string;
    montant: number;
}

export interface RecapitulationPDFData {
    items: RecapItem[];
    totalMontant: number;
    logoBase64?: string;
    title?: string;
    subtitle?: string;
    activiteCode?: string;
    activiteNom?: string;
}

// Interface pour les détails de la requête
export interface CategorieRubriqueColonne {
    idCategorieRubriqueColonne: number;
    idCategorieRubrique: number;
    nom: string;
    datatype: string;
    isFormule: number;
}

export interface RequeteRubrique {
    idRequeteRubrique: number;
    idRequete: number;
    idRubrique: number;
    idCategorieRubriqueColonne: number;
    valeur: string;
    rubrique?: Rubrique;
    categorieRubriqueColonne?: CategorieRubriqueColonne;
}

export interface Rubrique {
    idRubrique: number;
    idCategorieRubrique: number;
    nom: string;
    requeteRubriques: RequeteRubrique[];
}

export interface CategorieRubrique {
    idCategorieRubrique: number;
    nom: string;
    categorieRubriqueColonnes: CategorieRubriqueColonne[];
    rubriques: Rubrique[];
}

export interface DetailedRecapitulationPDFData {
    categories: CategorieRubrique[];
    recapItems: RecapItem[];
    totalMontant: number;
    logoBase64?: string;
    title?: string;
    subtitle?: string;
    activiteCode?: string;
    activiteNom?: string;
}

// Fonction pour convertir un nombre en texte en français (copiée depuis DemandePDF)
function numberToText(n) {
    if (typeof n !== "number" || isNaN(n)) return '';
    const units = ['', 'un', 'deux', 'trois', 'quatre', 'cinq', 'six', 'sept', 'huit', 'neuf', 'dix', 'onze', 'douze', 'treize', 'quatorze', 'quinze', 'seize', 'dix-sept', 'dix-huit', 'dix-neuf'];
    const tens = ['', '', 'vingt', 'trente', 'quarante', 'cinquante', 'soixante', 'soixante', 'quatre-vingt', 'quatre-vingt'];

    function convertLessThanThousand(num) {
        if (num === 0) return '';
        let result = '';
        if (num >= 100) {
            const hundreds = Math.floor(num / 100);
            if (hundreds === 1) {
                result += 'cent';
            } else {
                result += units[hundreds] + ' cent';
            }
            num %= 100;
            if (num === 0 && hundreds > 1) {
                result += 's';
            }
            if (num > 0) {
                result += ' ';
            }
        }
        if (num >= 20) {
            const ten = Math.floor(num / 10);
            const unit = num % 10;
            if (ten === 7 || ten === 9) {
                result += tens[ten - 1] + '-';
                if (unit === 1 && ten === 7) {
                    result += 'et-onze';
                } else {
                    result += units[unit + 10];
                }
            } else {
                result += tens[ten];
                if (unit === 1 && ten !== 8) {
                    result += ' et un';
                } else if (unit > 0) {
                    result += '-' + units[unit];
                }
                if (ten === 8 && unit === 0) result += 's';
            }
        } else if (num >= 1) {
            result += units[num];
        }
        return result.trim();
    }

    if (n === 0) return 'zéro';
    let result = '';
    const isNegative = n < 0;
    n = Math.abs(Math.floor(n));

    if (n >= 1_000_000_000) {
        const billions = Math.floor(n / 1_000_000_000);
        result += billions === 1 ? 'un milliard' : numberToText(billions) + ' milliards';
        n %= 1_000_000_000;
        if (n > 0) result += ' ';
    }
    if (n >= 1_000_000) {
        const millions = Math.floor(n / 1_000_000);
        result += millions === 1 ? 'un million' : numberToText(millions) + ' millions';
        n %= 1_000_000;
        if (n > 0) result += ' ';
    }
    if (n >= 1000) {
        const thousands = Math.floor(n / 1000);
        result += thousands === 1 ? 'mille' : numberToText(thousands) + ' mille';
        n %= 1000;
        if (n > 0) result += ' ';
    }
    if (n > 0) {
        result += convertLessThanThousand(n);
    }
    return (isNegative ? 'moins ' : '') + result.trim();
}


/**
 * Génère un PDF complet contenant les détails de chaque catégorie et le tableau récapitulatif final
 * @param data Les données pour le PDF détaillé de récapitulation
 * @returns Un objet jsPDF contenant le document généré
 */
function justifyText(doc, text, x, y, width, lineSpacing = 1.2) {
    const words = text.split(/\s+/);
    let line = '';
    let lines = [];
    const fontSize = doc.getFontSize();
    const baseLineHeight = fontSize * lineSpacing;

    // Split text into lines that fit within the specified width
    words.forEach(word => {
        const testLine = line + word + ' ';
        const testWidth = doc.getTextWidth(testLine);
        if (testWidth > width && line !== '') {
            lines.push(line.trim());
            line = word + ' ';
        } else {
            line = testLine;
        }
    });
    lines.push(line.trim());

    // Render each line (justify all except last)
    lines.forEach((lineText, i) => {
        const lineY = y + i * baseLineHeight;
        const wordsInLine = lineText.split(' ');

        if (i === lines.length - 1 || wordsInLine.length === 1) {
            // Last line or single-word line → normal left-aligned
            doc.text(lineText, x, lineY);
        } else {
            // Justify line
            const totalWordsWidth = wordsInLine.reduce(
                (acc, w) => acc + doc.getTextWidth(w),
                0
            );
            const spaceToAdd = (width - totalWordsWidth) / (wordsInLine.length - 1);

            let currentX = x;
            wordsInLine.forEach((w, j) => {
                doc.text(w, currentX, lineY);
                currentX += doc.getTextWidth(w) + spaceToAdd;
            });
        }
    });

    // Return the new Y position after the text block
    return y + lines.length * baseLineHeight;
}



function formatNumberFromString(value: string | number): string {
    const nf = new Intl.NumberFormat('fr-FR');
    if (typeof value === 'number') {
        return nf.format(value);
    }

    // Remove spaces and non-numeric grouping characters
    const normalized = value
        .replace(/\s/g, '')      // remove spaces
        .replace(/,/g, '.');     // normalize decimal separator if needed

    const number = Number(normalized);
    console.log(nf.format(number));
    return isNaN(number) ? value : nf.format(number);
}

export function generateDetailedRecapitulationPDF2(data: DetailedRecapitulationPDFData): jsPDF {
    const { categories, recapItems, totalMontant, logoBase64, title, subtitle, activiteCode, activiteNom } = data;
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    let currentY = 20;

    // Ajouter le logo si fourni
    if (logoBase64) {
        const logoWidth = 30;
        const logoHeight = 20;
        const logoX = (pageWidth - logoWidth) / 2; // Centrer le logo
        doc.addImage(logoBase64, 'PNG', logoX, 10, logoWidth, logoHeight);
        currentY += 25; // Augmenter la position Y pour éviter le chevauchement avec le logo
    }

    // Ajouter le titre si fourni
    if (title) {
        doc.setFont("helvetica", "bold");
        doc.setFontSize(16);
        doc.text(title, pageWidth / 2, currentY, { align: "center" });
        currentY += 10;
    }

    // Ajouter le sous-titre si fourni
   /* if (subtitle) {
        doc.setFont("helvetica", "normal");
        doc.setFontSize(12);
        doc.text(activiteCode + "-" + activiteNom, pageWidth / 2, currentY, { align: "center" });
        currentY += 10;
    }*/

    // Ajouter des informations sur l'activité si fournies
    if (activiteCode && activiteNom) {
        doc.setFont("helvetica", "bold");
        doc.setFontSize(11);
        //doc.text(`Activité: ${activiteCode} - ${activiteNom}`, 14, currentY);
        
        
        currentY = justifyText(doc, `Activité: ${activiteCode} - ${activiteNom}`, 14, currentY, 180, 0.5);
        doc.text("", 14, currentY);
        currentY = currentY + 14;
    }

    // Pour chaque catégorie, créer un tableau détaillé
    for (const categorie of categories) {
        // Titre de la catégorie
        doc.setFont("helvetica", "bold");
        doc.setFontSize(12);
        doc.text(categorie.nom.toUpperCase(), 14, currentY);
        currentY += 6;

        // Déterminer les en-têtes de colonnes
        const colonnes = categorie.categorieRubriqueColonnes;
        const headers = ["Rubrique", ...colonnes.map(col => col.nom === "Unit" ? "Unité" : col.nom === "Total" ? "Montant" : col.nom === "Total_valide" ? "Montant validé" : col.nom)];

        // Préparer les données pour les lignes
        const bodyData: string[][] = [];
        console.log("ghvkchljjhl");
        for (const rubrique of categorie.rubriques) {
            if (rubrique.requeteRubriques && rubrique.requeteRubriques.length > 0) {
                const row: string[] = [rubrique.nom];

                // Pour chaque colonne, trouver la valeur correspondante dans requeteRubriques
                for (const colonne of colonnes) {
                    const requeteRubrique = rubrique.requeteRubriques.find(
                        rr => rr.idCategorieRubriqueColonne === colonne.idCategorieRubriqueColonne
                    );

                    if (requeteRubrique) {
                        console.log("888888888888888");
                        // Formater la valeur en fonction du type de données
                        if (colonne.datatype === 'float' || colonne.datatype === 'nombre') {
                            console.log("6666666666666");
                            const numValue = parseFloat(requeteRubrique.valeur);
                            // Format avec des espaces comme séparateurs de milliers
                            const formattedValue = isNaN(numValue) ? "0" : Math.round(numValue).toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ");
                            
                            console.log(formattedValue);
                            row.push(formattedValue);
                        } else if (colonne.datatype === 'date') {
                            try {
                                const date = new Date(requeteRubrique.valeur);
                                row.push(date.toLocaleDateString('fr-FR'));
                            } catch {
                                row.push(requeteRubrique.valeur);
                            }
                        } else {
                            row.push(requeteRubrique.valeur);
                        }
                    } else {
                        row.push(""); // Valeur vide si aucune correspondance
                    }
                }

                bodyData.push(row);
            }
        }
        console.log("ghvkchljjhl22222222");
        // Générer le tableau pour cette catégorie
        if (bodyData.length > 0) {
            autoTable(doc, {
                startY: currentY,
                head: [headers],
                body: bodyData,
                styles: {
                    fontSize: 6,
                    lineColor: [0, 0, 0],
                    lineWidth: 0.1,
                    cellPadding: 2,
                    overflow: 'linebreak',
                    cellWidth: 'wrap'
                },
                headStyles: {
                    fontSize: 6,
                    fillColor: [220, 220, 220],
                    textColor: [0, 0, 0],
                    fontStyle: 'bold',
                    halign: 'left',
                    overflow: 'linebreak',
                    cellWidth: 'wrap'
                },
                theme: 'grid',
                horizontalPageBreak: true,
            });

            // Mettre à jour currentY après la génération du tableau
            const finalY = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY || currentY;
            currentY = finalY + 15; // Espace après le tableau
        } else {
            currentY += 10; // Espace si tableau vide
        }

        // Vérifier si une nouvelle page est nécessaire
        if (currentY > doc.internal.pageSize.getHeight() - 20) {
            doc.addPage();
            currentY = 20;
        }
    }

    // Ajouter le tableau récapitulatif
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.text("RÉCAPITULATION", 14, currentY);
    currentY += 6;

    // Préparer les données du tableau récapitulatif
    const recapTableData = recapItems.map(item => {
        // Format avec des espaces comme séparateurs de milliers
        console.log(item);
        const formattedMontant = Math.round(item.montant).toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ");
        console.log(formattedMontant);
        return [
            item.designation,
            formattedMontant
        ];
    });

    // Ajouter la ligne TOTAL
    // Format avec des espaces comme séparateurs de milliers
    const formattedTotal = Math.round(totalMontant).toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ");
    recapTableData.push([
        "TOTAL",
        formattedTotal
    ]);

    // Générer le tableau récapitulatif
    autoTable(doc, {
        startY: currentY,
        head: [["DÉSIGNATION", "MONTANT"]],
        body: recapTableData,
        styles: {
            fontSize: 10,
            lineColor: [0, 0, 0],
            lineWidth: 0.1,
            cellPadding: 3
        },
        headStyles: {
            fillColor: [200, 200, 200],
            textColor: [0, 0, 0],
            fontStyle: 'bold',
            halign: 'left'
        },
        columnStyles: {
            0: {
                cellWidth: 120,
            },
            1: {
                cellWidth: 60,
                halign: 'right',
                overflow: 'ellipsize'
            }
        },
        didParseCell: (data) => {
            // Mettre en gras la ligne du total
            if (data.row.index === recapTableData.length - 1) {
                data.cell.styles.fontStyle = 'bold';
            }
        },
        theme: 'grid'
    });

    // Afficher le montant total en lettres après le tableau
    const finalYRecap = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY || currentY;
    const montantEnTexte = numberToText(Math.floor(totalMontant)) + ' Ariary';
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.text('Montant total :', 14, finalYRecap + 8);
    doc.setFont('helvetica', 'normal');
    const wrappedText = doc.splitTextToSize(montantEnTexte, pageWidth - 28);
    doc.text(wrappedText, 14, finalYRecap + 14);

    return doc;
}

export function generateDetailedRecapitulationPDF(
    data: DetailedRecapitulationPDFData
): jsPDF {

    const {
        categories,
        recapItems,
        totalMontant,
        logoBase64,
        title,
        activiteCode,
        activiteNom
    } = data;

    const doc = new jsPDF();

    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();

    const marginLeft = 14;
    const marginRight = 14;

    const usableWidth = pageWidth - marginLeft - marginRight;

    let currentY = 20;

    /* ---------------- LOGO ---------------- */

    if (logoBase64) {

        const logoWidth = 30;
        const logoHeight = 20;
        const logoX = (pageWidth - logoWidth) / 2;

        doc.addImage(logoBase64, "PNG", logoX, 10, logoWidth, logoHeight);

        currentY += 25;
    }

    /* ---------------- TITLE ---------------- */

    if (title) {

        doc.setFont("helvetica", "bold");
        doc.setFontSize(16);

        doc.text(title, pageWidth / 2, currentY, { align: "center" });

        currentY += 10;
    }

    /* ---------------- ACTIVITY ---------------- */

    if (activiteCode && activiteNom) {

        doc.setFont("helvetica", "bold");
        doc.setFontSize(11);

        const text = `Activité: ${activiteCode} - ${activiteNom}`;

        const wrapped = doc.splitTextToSize(text, usableWidth);

        doc.text(wrapped, marginLeft, currentY);

        currentY += wrapped.length * 6 + 8;
    }

    /* =====================================================
       CATEGORY TABLES
    ====================================================== */

    for (const categorie of categories) {

        doc.setFont("helvetica", "bold");
        doc.setFontSize(12);

        doc.text(categorie.nom.toUpperCase(), marginLeft, currentY);

        currentY += 6;

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

        /* ---------------- BUILD BODY DATA ---------------- */

        const bodyData: string[][] = [];

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
                        : Math.round(num)
                            .toString()
                            .replace(/\B(?=(\d{3})+(?!\d))/g, " ");

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

            bodyData.push(row);
        }

        if (!bodyData.length) {

            currentY += 10;

            continue;
        }

        /* =====================================================
           COLUMN SPLITTING (KEEP FIRST COLUMN)
        ====================================================== */

        const firstColumnWidth = 50;
        const otherColumnWidth = 25;

        const fixedHeader = headers[0];       // Rubrique
        const otherHeaders = headers.slice(1);

        const maxOtherColumns =
            Math.floor((usableWidth - firstColumnWidth) / otherColumnWidth);

        for (let start = 0; start < otherHeaders.length; start += maxOtherColumns) {

            const headerSlice = [
                fixedHeader,
                ...otherHeaders.slice(start, start + maxOtherColumns)
            ];

            const bodySlice = bodyData.map(row => {

                const first = row[0];

                const rest = row.slice(
                    start + 1,
                    start + 1 + maxOtherColumns
                );

                return [first, ...rest];
            });

            autoTable(doc, {

                startY: currentY,

                head: [headerSlice],

                body: bodySlice,

                styles: {
                    fontSize: 6,
                    lineColor: [0, 0, 0],
                    lineWidth: 0.1,
                    cellPadding: 2,
                    overflow: "linebreak"
                },

                headStyles: {
                    fillColor: [220, 220, 220],
                    textColor: [0, 0, 0],
                    fontStyle: "bold"
                },

                columnStyles: {
                    0: { cellWidth: firstColumnWidth }
                },

                theme: "grid"
            });

            const finalY =
                (doc as any).lastAutoTable.finalY || currentY;

            currentY = finalY + 10;

            if (currentY > pageHeight - 20) {

                doc.addPage();

                currentY = 20;
            }
        }

        currentY += 5;
    }

    /* =====================================================
       RECAP TABLE
    ====================================================== */

    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);

    doc.text("RÉCAPITULATION", marginLeft, currentY);

    currentY += 6;

    const recapTableData = recapItems.map(item => {

        const montant = Math.round(item.montant)
            .toString()
            .replace(/\B(?=(\d{3})+(?!\d))/g, " ");

        return [item.designation, montant];
    });

    const formattedTotal = Math.round(totalMontant)
        .toString()
        .replace(/\B(?=(\d{3})+(?!\d))/g, " ");

    recapTableData.push(["TOTAL", formattedTotal]);

    autoTable(doc, {

        startY: currentY,

        head: [["DÉSIGNATION", "MONTANT"]],

        body: recapTableData,

        styles: {
            fontSize: 10,
            lineColor: [0, 0, 0],
            lineWidth: 0.1,
            cellPadding: 3
        },

        headStyles: {
            fillColor: [200, 200, 200],
            textColor: [0, 0, 0],
            fontStyle: "bold"
        },

        columnStyles: {

            0: { cellWidth: 120 },

            1: {
                cellWidth: 60,
                halign: "right"
            }
        },

        didParseCell: (data) => {

            if (data.row.index === recapTableData.length - 1) {

                data.cell.styles.fontStyle = "bold";
            }
        },

        theme: "grid"
    });

    const finalYRecap =
        (doc as any).lastAutoTable.finalY || currentY;

    const montantEnTexte =
        numberToText(Math.floor(totalMontant)) + " Ariary";

    doc.setFont("helvetica", "bold");

    doc.text("Montant total :", marginLeft, finalYRecap + 10);

    doc.setFont("helvetica", "normal");

    const wrapped = doc.splitTextToSize(
        montantEnTexte,
        usableWidth
    );

    doc.text(wrapped, marginLeft, finalYRecap + 16);

    return doc;
}

/**
 * Génère un PDF contenant uniquement le tableau de récapitulation des dépenses
 * @param data Les données pour le PDF de récapitulation
 * @returns Un objet jsPDF contenant le document généré
 */
export function generateRecapitulationPDF(data: RecapitulationPDFData): jsPDF {
    const { items, totalMontant, logoBase64, title, subtitle, activiteCode, activiteNom } = data;
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    let currentY = 20;
    

    // Ajouter le logo si fourni
    if (logoBase64) {
        const logoWidth = 30;
        const logoHeight = 20;
        const logoX = (pageWidth - logoWidth) / 2; // Centrer le logo
        doc.addImage(logoBase64, 'PNG', logoX, 10, logoWidth, logoHeight);
        currentY += 25; // Augmenter la position Y pour éviter le chevauchement avec le logo
    }

    // Ajouter le titre si fourni
    if (title) {
        doc.setFont("helvetica", "bold");
        doc.setFontSize(16);
        doc.text(title, pageWidth / 2, currentY, { align: "center" });
        currentY += 10;
    }

    // Ajouter le sous-titre si fourni
    /*if (subtitle) {
        doc.setFont("helvetica", "normal");
        doc.setFontSize(12);
        doc.text(activiteCode + "-" + activiteNom , pageWidth / 2, currentY, { align: "center" });
        currentY += 10;
    }*/

    // Ajouter des informations sur l'activité si fournies
    if (data.activiteCode && data.activiteNom) {
        doc.setFont("helvetica", "bold");
        doc.setFontSize(11);
        doc.text(`Activité: ${data.activiteCode} - ${data.activiteNom}`, 14, currentY);
        currentY += 8;
    }

    // Ajouter le tableau de récapitulation
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.text("RÉCAPITULATION", 14, currentY);
    currentY += 6;

    // Préparer les données du tableau avec une ligne de total
    const tableData = items.map(item => {
        // Format avec des espaces comme séparateurs de milliers
        const formattedMontant = Math.round(item.montant).toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ");
        console.log(formattedMontant);
        return [
            item.designation,
            formattedMontant
        ];
    });

    // Ajouter la ligne TOTAL
    // Format avec des espaces comme séparateurs de milliers
    const formattedTotal2 = Math.round(totalMontant).toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ");
    tableData.push([
        "TOTAL",
        formattedTotal2
    ]);

    // Générer le tableau
    autoTable(doc, {
        startY: currentY,
        head: [["DÉSIGNATION", "MONTANT"]],
        body: tableData,
        styles: {
            fontSize: 10,
            lineColor: [0, 0, 0],
            lineWidth: 0.1,
            cellPadding: 3
        },
        headStyles: {
            fillColor: [200, 200, 200],
            textColor: [0, 0, 0],
            fontStyle: 'bold',
            halign: 'left'
        },
        columnStyles: {
            0: {
                cellWidth: 120,
                fontStyle: tableData.length > 1 ? 'normal' : 'bold' // Appliquer le style gras uniquement à la dernière ligne (TOTAL)
            },
            1: {
                cellWidth: 60,
                halign: 'right',
                fontStyle: tableData.length > 1 ? 'normal' : 'bold',
                overflow: 'ellipsize'
            }
        },
        didParseCell: (data) => {
            // Mettre en gras la ligne du total
            if (data.row.index === tableData.length - 1) {
                data.cell.styles.fontStyle = 'bold';
            }
        },
        theme: 'grid'
    });

    // Afficher le montant total en lettres après le tableau
    // @ts-expect-error: propriété ajoutée par autoTable
    const finalYRecap2 = doc.lastAutoTable ? doc.lastAutoTable.finalY : currentY;
    const montantEnTexte2 = numberToText(Math.floor(totalMontant)) + ' Ariary';
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.text('Montant total :', 14, finalYRecap2 + 8);
    doc.setFont('helvetica', 'normal');
    const wrappedText2 = doc.splitTextToSize(montantEnTexte2, pageWidth - 28);
    doc.text(wrappedText2, 14, finalYRecap2 + 14);

    return doc;
}


/*
 Version alternative 
 */
export function generateExactRecapitulationPDF(data: RecapitulationPDFData): jsPDF {
    const { items, totalMontant } = data;
    console.log("items");
    console.log(items);
    const doc = new jsPDF();

    // Configuration des marges et dimensions
    const margin = 14;
    const pageWidth = doc.internal.pageSize.getWidth();
    const tableWidth = pageWidth - (margin * 2);
    const colWidth1 = tableWidth * 0.65; // 65% pour la désignation au lieu de 70%

    // Position Y de départ
    let currentY = 30;

    // Titre du tableau
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.text("RÉCAPITULATION", margin, currentY);
    currentY += 8;

    // Dessiner l'en-tête du tableau avec un fond gris
    doc.setFillColor(220, 220, 220); // Gris clair
    doc.rect(margin, currentY, tableWidth, 8, 'F');

    // Texte de l'en-tête
    doc.setFontSize(10);
    doc.text("DÉSIGNATION", margin + 2, currentY + 5.5);
    doc.text("MONTANT (en AR)", margin + colWidth1 + 5, currentY + 5.5);

    // Dessiner les lignes de l'en-tête
    doc.setDrawColor(0);
    doc.setLineWidth(0.1);
    doc.line(margin, currentY, margin + tableWidth, currentY); // Ligne supérieure
    doc.line(margin, currentY + 8, margin + tableWidth, currentY + 8); // Ligne inférieure
    doc.line(margin, currentY, margin, currentY + 8); // Ligne gauche
    doc.line(margin + colWidth1, currentY, margin + colWidth1, currentY + 8); // Ligne séparatrice
    doc.line(margin + tableWidth, currentY, margin + tableWidth, currentY + 8); // Ligne droite

    currentY += 8; // Passer à la première ligne de données

    // Hauteur de chaque ligne
    const rowHeight = 7;

    // Dessiner les lignes de données
    doc.setFont("helvetica", "normal");
    for (let i = 0; i < items.length; i++) {
        const item = items[i];

        // Texte de la ligne
        doc.text(item.designation, margin + 2, currentY + 5);
        // Format avec des espaces comme séparateurs de milliers
        const formattedMontant = Math.round(item.montant).toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ");
        // Aligner à droite en laissant une marge de 5 points
        doc.text(
            formattedMontant,
            margin + tableWidth - 5,
            currentY + 5,
            { align: "right" }
        );

        // Dessiner les bordures de la ligne
        doc.line(margin, currentY, margin + tableWidth, currentY); // Ligne supérieure
        doc.line(margin, currentY + rowHeight, margin + tableWidth, currentY + rowHeight); // Ligne inférieure
        doc.line(margin, currentY, margin, currentY + rowHeight); // Ligne gauche
        doc.line(margin + colWidth1, currentY, margin + colWidth1, currentY + rowHeight); // Ligne séparatrice
        doc.line(margin + tableWidth, currentY, margin + tableWidth, currentY + rowHeight); // Ligne droite

        currentY += rowHeight; // Passer à la ligne suivante
    }

    // Dessiner la ligne TOTAL
    doc.setFont("helvetica", "bold");
    doc.text("TOTAL", margin + 2, currentY + 5);
    // Format avec des espaces comme séparateurs de milliers
    const formattedTotal3 = Math.round(totalMontant).toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ");
    // Aligner à droite en laissant une marge de 5 points
    doc.text(
        formattedTotal3,
        margin + tableWidth - 5,
        currentY + 5,
        { align: "right" }
    );

    // Dessiner les bordures de la ligne TOTAL
    doc.line(margin, currentY, margin + tableWidth, currentY); // Ligne supérieure
    doc.line(margin, currentY + rowHeight, margin + tableWidth, currentY + rowHeight); // Ligne inférieure
    doc.line(margin, currentY, margin, currentY + rowHeight); // Ligne gauche
    doc.line(margin + colWidth1, currentY, margin + colWidth1, currentY + rowHeight); // Ligne séparatrice
    doc.line(margin + tableWidth, currentY, margin + tableWidth, currentY + rowHeight); // Ligne droite

    return doc;
}