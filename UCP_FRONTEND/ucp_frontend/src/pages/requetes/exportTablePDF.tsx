import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

export function exportTableToPDF({
    title,
    headers,
    rows,
    fileName = "export.pdf"
}: {
    title: string;
    headers: string[];
    rows: (string | number)[][];
    fileName?: string;
}) {
    const doc = new jsPDF('landscape');

    // Titre
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text(title, doc.internal.pageSize.width / 2, 18, { align: "center" });

    // Traitement des nombres 
    const formattedRows = rows.map(row =>
        row.map(cell => {
            if (typeof cell === 'number') {
                // séparateurs de milliers 
                return Math.round(cell).toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ");
            }
            return cell;
        })
    );

    // Tableau
    autoTable(doc, {
        startY: 28,
        head: [headers],
        body: formattedRows,
        styles: {
            font: "helvetica",
            fontSize: 8.5,
            lineColor: [0, 0, 0],
            lineWidth: 0.1,
            cellPadding: 2,
            overflow: 'linebreak',
            minCellHeight: 10
        },
        headStyles: {
            fillColor: [220, 220, 220],
            textColor: [0, 0, 0],
            fontStyle: 'bold',
            halign: 'center',
            fontSize: 9
        },
        columnStyles: {

            0: { cellWidth: 15 }, // ID
            7: { halign: 'right' }, // Montant
        },
        theme: 'grid',
        didParseCell: function (data) {

            if (typeof data.cell.raw === 'number' ||
                (typeof data.cell.raw === 'string' && !isNaN(parseFloat(data.cell.raw.toString().replace(/\s/g, ''))))) {
                data.cell.styles.halign = 'right';
            }


            const colWidth = doc.getStringUnitWidth(String(data.cell.text)) * data.cell.styles.fontSize / doc.internal.scaleFactor;
            if (colWidth > data.cell.width) {
                data.cell.styles.overflow = 'linebreak';
            }
        }
    });

    // Date/heure en bas de page
    const now = new Date();
    const formattedDateTime = now.toLocaleDateString('fr-FR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
    });
    doc.setFontSize(8);
    doc.text(`Édité le ${formattedDateTime}`, 10, doc.internal.pageSize.height - 10);

    doc.save(fileName);
} 