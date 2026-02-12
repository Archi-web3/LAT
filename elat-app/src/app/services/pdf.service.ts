import { Injectable } from '@angular/core';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { AssessmentState } from '../models/assessment.model';

@Injectable({
    providedIn: 'root'
})
export class PdfService {

    constructor() { }

    generateAssessmentReport(assessment: AssessmentState, sections: any[], transversalComponents: string[]) {
        if (!assessment.context) return;

        const doc = new jsPDF();
        const pageWidth = doc.internal.pageSize.width;

        // --- Header ---
        doc.setFontSize(22);
        doc.text('Logistics Assessment Tool (LAT)', 105, 20, { align: 'center' });

        doc.setFontSize(14);
        doc.text(`Rapport d'évaluation - ${assessment.context.base}`, 105, 30, { align: 'center' });

        // Context Info
        doc.setFontSize(10);
        doc.text(`Pays: ${assessment.context.country}`, 14, 45);
        doc.text(`Base: ${assessment.context.base}`, 14, 50);
        doc.text(`Période: ${assessment.context.evaluationMonth}`, 14, 55);
        doc.text(`Date du rapport: ${new Date().toLocaleDateString()}`, 14, 60);

        // Author Info
        const author = assessment.submittedBy || 'Utilisateur inconnu';
        doc.text(`Auteur: ${author}`, 140, 45);

        if (assessment.validatedBy) {
            doc.text(`Validé par: ${assessment.validatedBy}`, 140, 50);
            doc.text(`Le: ${new Date(assessment.validatedAt!).toLocaleDateString()}`, 140, 55);
        }

        // --- Global Score ---
        doc.setDrawColor(0);
        doc.setFillColor(230, 230, 230);
        doc.rect(14, 70, pageWidth - 28, 20, 'F');
        doc.setFontSize(16);
        doc.text(`Score Global: ${assessment.score}%`, pageWidth / 2, 83, { align: 'center' });

        let currentY = 100;

        // --- Sections Details ---
        sections.forEach(section => {
            // Section Header
            doc.setFontSize(14);
            doc.setTextColor(0, 51, 102); // Dark Blue
            doc.text(section.title, 14, currentY);

            currentY += 5;

            // Prepare Table Data
            const body = section.questions.map((q: any) => {
                const val = assessment.answers ? assessment.answers[q.id] : undefined;
                let displayVal = 'N/A';
                if (val !== undefined && val !== -1) {
                    displayVal = q.options.find((o: any) => o.value === val)?.label || val.toString();
                }

                const comment = (assessment.comments && assessment.comments[q.id]) || '';
                const hasPhoto = assessment.proofPhotos && assessment.proofPhotos[q.id];

                return [
                    q.id,
                    q.text,
                    displayVal,
                    comment,
                    hasPhoto ? 'Oui' : 'Non'
                ];
            });

            autoTable(doc, {
                startY: currentY,
                head: [['ID', 'Question', 'Réponse', 'Commentaire', 'Photo']],
                body: body,
                theme: 'grid',
                headStyles: { fillColor: [41, 128, 185] }, // Blue header
                styles: { fontSize: 8, cellPadding: 2 },
                columnStyles: {
                    0: { cellWidth: 15 },
                    1: { cellWidth: 80 },
                    2: { cellWidth: 30 },
                    3: { cellWidth: 40 },
                    4: { cellWidth: 15 }
                },
                margin: { top: 20 },
                didDrawPage: (data) => {
                    // Header on new pages?
                }
            });

            // @ts-ignore
            currentY = doc.lastAutoTable.finalY + 15;

            // Check page break
            if (currentY > 250) {
                doc.addPage();
                currentY = 20;
            }
        });

        // Footer with Page Numbers
        const pageCount = doc.getNumberOfPages();
        for (let i = 1; i <= pageCount; i++) {
            doc.setPage(i);
            doc.setFontSize(8);
            doc.setTextColor(100);
            doc.text(`Page ${i} / ${pageCount}`, pageWidth / 2, 290, { align: 'center' });
        }

        // Save
        doc.save(`LAT_Report_${assessment.context.base}_${assessment.context.evaluationMonth}.pdf`);
    }
}
