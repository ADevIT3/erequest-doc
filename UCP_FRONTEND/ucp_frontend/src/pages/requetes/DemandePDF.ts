import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

export interface RequetePDFData {
    activiteCode: string;
    activiteNom: string;
    montant: number;
    dateExecution: string;
    numRequete: string;
    description: string;
    lieu: string;
    objet: string;
    copie_a: string;
    compte_rendu: string;
    pourInformations: string;
    fonction: string;
    dateSoumission: string;
    userFullName: {
        lastname: string,

        typeagmo: string,
    }
    site: {
        idSite: number,
        nom: string
    }
    entete: {
        firstn: string;
        seconden: string;
        thirdn: string;
        fourthn: string;
        fifthn: string;
    };
}

// Fonction pour convertir un nombre en texte en français
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

function justifyText(doc, text, x, y, width, lineSpacing = 0.5) {
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
function measureJustifiedText(doc, text, x, y, width, lineSpacing = 1.2) {
    const words = text.split(/\s+/);
    let line = '';
    let lines = [];
    const fontSize = doc.getFontSize();
    const baseLineHeight = fontSize * lineSpacing;

    // Split text into lines that fit within the width
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

    // Calculate where the text block would end
    const newY = y + lines.length * baseLineHeight;
    return newY;
}

function centerText(doc, text, x, y, width, lineSpacing = 1.2) {
    const fontSize = doc.getFontSize();
    const baseLineHeight = fontSize * lineSpacing;

    // Split text into multiple lines that fit inside the given width
    const lines = doc.splitTextToSize(text, width);

    lines.forEach((line, i) => {
        const textWidth = doc.getTextWidth(line);
        const textX = x + (width - textWidth) / 2; // center within the region
        const lineY = y + i * baseLineHeight;
        doc.text(line, textX, lineY);
    });

    // Return new Y position after drawing all lines
    return y + lines.length * baseLineHeight;
}


export function generateDemandePDF(logoBase64: string, requete: RequetePDFData) {
    const doc = new jsPDF();

    // Ajout du logo si fourni (x=10, y=5, largeur=30, hauteur=18 à ajuster)
    if (logoBase64) {
        doc.addImage(logoBase64, 'PNG', 80, 5, 50, 30);
    }

    // En-tête dynamique
    function formatEnteteText(text: string, x: number, y: number, lineHeight: number) {
        if (text.length > 40) {
            // Points de coupure préférés pour les textes longs
            const breakPoints = ["DE LA ", " DE ", " DU "];
            let breakIndex = -1;

            // Cherche le meilleur point de coupure
            for (const point of breakPoints) {
                const idx = text.indexOf(point, text.length / 3);
                if (idx !== -1) {
                    breakIndex = idx + point.length;
                    break;
                }
            }

            // Si aucun point de coupure idéal trouvé, couper au milieu
            if (breakIndex === -1) {
                breakIndex = Math.floor(text.length / 2);
                // Ajuster pour ne pas couper un mot
                while (breakIndex < text.length && text[breakIndex] !== ' ') {
                    breakIndex++;
                }
            }

            const firstPart = text.substring(0, breakIndex).trim();
            const secondPart = text.substring(breakIndex).trim();

            doc.text(firstPart, x, y, { align: "center" });
            doc.text(secondPart, x, y + lineHeight, { align: "center" });

            return lineHeight * 2; // Retourne l'espace occupé verticalement
        } else {
            doc.text(text, x, y, { align: "center" });
            return lineHeight;
        }
    }

    // En-tête dynamique
    doc.setFontSize(11);
    doc.setFont("times", "bold");
    // Position x pour le centre de l'en-tête
    const enteteX = 55;
    let yOffset = 15 + (logoBase64 ? 18 : 0);

    // Placer les lignes d'en-tête avec la nouvelle fonction
    doc.text(requete.entete.firstn, enteteX, yOffset, { align: "center" });
    yOffset += 7;

    doc.text(requete.entete.seconden, enteteX, yOffset, { align: "center" });
    yOffset += 7;

    yOffset += formatEnteteText(requete.entete.thirdn, enteteX, yOffset, 5);
    yOffset += formatEnteteText(requete.entete.fourthn, enteteX, yOffset + 3, 5);
    if (requete.entete.fifthn != "") {
        yOffset += formatEnteteText(requete.entete.fifthn, enteteX, yOffset + 8, 7);
    }


    // Numéro et date
    doc.setFontSize(11);
    doc.setFont("times", "normal");
    doc.text("REQ "+requete.numRequete, 10, yOffset + 8);

    // Colonne de droite
    const dateSoumission = new Date(requete.dateSoumission);
    const dateFormatted = dateSoumission.toLocaleDateString('fr-FR', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });


    //doc.text(`${requete.lieu}, ${dateFormatted}`, 140, 15 + (logoBase64 ? 18 : 0));
    let currentYH = centerText(doc, `${requete.lieu.charAt(0).toUpperCase() + requete.lieu.slice(1).toLowerCase()}, ${dateFormatted}`, 125, 22 + 10, 100 - 28, 1);

    // Destinataire
    doc.setFont("times", "normal");
    //doc.text("LE MEDECIN INSPECTEUR", 140, 21 + (logoBase64 ? 18 : 0));
    //doc.text(`${requete.userFullName.lastname.toUpperCase()} ${requete.userFullName.typeagmo.toUpperCase()}`, 140, 21 + (logoBase64 ? 18 : 0));
    //doc.text(`${requete.fonction.toUpperCase()}`, 140, 21 + (logoBase64 ? 18 : 0));
    centerText(doc, `${requete.fonction.toUpperCase()}`, 125, 21 + 18, 100 - 28, 1);
    doc.setFont("times", "normal");
    //doc.text("À", 155, 30 + (logoBase64 ? 18 : 0));
    centerText(doc, "À", 125, 30 + 18, 100 - 28, 1);
    //doc.text("Monsieur le Coordinateur National de l'Unité de coordination de Projet", 130, 36 + (logoBase64 ? 18 : 0), { maxWidth: 60 });
    centerText(doc, "Monsieur le Coordinateur National de l'Unité de coordination de Projet", 130, 36 + 18, 90 - 28, 0.5);
    //doc.text(`${requete.userFullName.lastname}, ${requete.userFullName.firstname}`, 20, 74 + (logoBase64 ? 18 : 0));
    //doc.text("- ANTANANARIVO -", 140, 50 + (logoBase64 ? 18 : 0));
    centerText(doc, "- ANTANANARIVO -", 125, 50 + 18, 100 - 28, 1);

    // Objet
    doc.setFont("times", "bold");
    doc.text("Objet:", 10, yOffset + (logoBase64 ? 18 : 0));
    doc.setFont("times", "normal");
    /*doc.text(
        /*`Requête de financement de l'activité ${requete.activiteCode} : ${requete.activiteNom}`,*/
    /*`${requete.objet}`,
    23, 65 + (logoBase64 ? 18 : 0)
);*/

    // Corps du texte
    //doc.text("Monsieur le Coordinateur,", 23, justifyText(doc, `${requete.objet}`, 23, 83, 171, 0.5) + 14 + (logoBase64 ? 18 : 0), { maxWidth: 60 });
    yOffset = justifyText(doc, `${requete.objet}`, 23, yOffset + (logoBase64 ? 18 : 0)  , 171, 0.5) + 14 + (logoBase64 ? 18 : 0);
    doc.setFontSize(11);
    /*doc.text(
        `Dans le cadre de la mise en œuvre du Projet d'Amélioration des Résultats nutritionnels au niveau de la direction Régionale de la Santé Publique Amoron'i Mania. Nous prévoyons ${requete.activiteNom.toLowerCase()} le ${dateFormatted}.`,
        10, 82 + (logoBase64 ? 18 : 0), { maxWidth: 190 }
    );*/
    /*doc.text(
        `${requete.description}`,
        10, 82 + (logoBase64 ? 18 : 0), { maxWidth: 190 }
    );*/
    let currentY = justifyText(doc, `Monsieur le Coordonnateur,`, 15, 120, 180, 0.5) + 14 + (logoBase64 ? 18 : 0) - 25;

     currentY = justifyText(doc, `${requete.description}`, 15, 130, 180, 0.5) + 14 + (logoBase64 ? 18 : 0) - 25;

    /*doc.text(
        "Aussi, ai-je l'honneur de vous soumettre la présente requête d'un montant total de :",
        10, currentY
    );*/

    currentY = justifyText(doc, "Aussi, ai-je l'honneur de vous soumettre la présente requête d'un montant total de :", 15, currentY, 170, 0.5) - 18;

    // Convertir le montant en texte
    const montantEnTexte = numberToText(Math.floor(requete.montant || 0)) + ' Ariary';
    doc.setFont("times", "bold");

    currentY = justifyText(doc, montantEnTexte, 15, currentY + (logoBase64 ? 18 : 0), 170, 0.5) - 18;

    //doc.text(montantEnTexte, 10, currentY  + (logoBase64 ? 18 : 0));

    // Format avec des espaces comme séparateurs de milliers
    const formattedMontant = Math.round(requete.montant || 0).toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ");

    // Tableau
    autoTable(doc, {
        startX: 10,
        startY: currentY + (logoBase64 ? 18 : 0),
        head: [["N° de l'activité", "Intitulé de l'activité", "Montant Total de la requête (Ar)"]],
        body: [
            [
                requete.activiteCode,
                requete.activiteNom,
                formattedMontant
            ]
        ],
        styles: {
            font: "times",
            fontSize: 10,
            lineColor: [0, 0, 0],
            lineWidth: 0.1
        },
        headStyles: {
            textColor: 0,
            fontStyle: "bold",
            fillColor: false
        },
        theme: "grid",
        columnStyles: {
            0: { cellWidth: 30 },
            1: { cellWidth: 90 },
            2: { cellWidth: 60, halign: "right", overflow: "ellipsize" }
        }
    });

    // Suite du texte
    // @ts-expect-error: doc.lastAutoTable est une propriété ajoutée par autoTable mais non typée dans jsPDF
    const finalY = doc.lastAutoTable ? doc.lastAutoTable.finalY : 130 + (logoBase64 ? 18 : 0);
    doc.setFont("times", "normal");
    doc.text(
        "Je vous certifie ainsi que le budget détaillé et les pièces y afférentes sont joints en annexe.",
        15, finalY + 10
    );
    doc.text(
        "En vous remerciant de votre aimable collaboration, je vous prie d'agréer, Monsieur, l'assurance de ma considération distinguée.",
        15, finalY + 18, { maxWidth: 190 }
    );

    if (requete.pourInformations == null || requete.pourInformations == "") {
        // Copie à
        doc.setFont("times", "bold");
        doc.text("Copie à :", 10, finalY + 32);
        doc.setFont("times", "normal");
        //doc.text("Madame Le Secrétaire Général de la Santé Publique", 20, finalY + 38);
        //doc.text(requete.copie_a, 20, finalY + 38);
        //doc.setFont("times", "italic");
        doc.setFont("times", "normal");
        doc.text(requete.compte_rendu, 10, finalY + 46);
        doc.setFont("times", "bold");
        doc.text("« À titre de compte rendu »", 20, finalY + 54);

    } else {
        doc.setFont("times", "normal");
        //doc.text("Madame Le Secrétaire Général de la Santé Publique", 20, finalY + 38);
        doc.text(requete.pourInformations, 10, finalY + 32);
        doc.setFont("times", "bold");
        doc.text("À titre d'informations :", 20, finalY + 38);

    }


    return doc;
}

// Utilisation :
// 1. Chargez le logo en base64 dans votre composant React
// 2. Appelez generateDemandePDF(logoBase64, requete)