import { Injectable, inject, signal } from '@angular/core';
import { AssessmentService } from './assessment.service';
import { AssessmentState } from '../models/assessment.model';

export interface DashboardMetrics {
    totalAssessments: number;
    averageScore: number;
    activeCountries: number;
    byCountry: { name: string; count: number; score: number }[];
    byBase: { name: string; count: number; score: number }[];
    evolution: { name: string; value: number }[]; // Month -> Avg Score
}

@Injectable({
    providedIn: 'root'
})
export class DashboardService {
    private assessmentService = inject(AssessmentService);

    // Computes metrics from a list of assessments
    computeMetrics(assessments: any[]): DashboardMetrics {
        if (!assessments || assessments.length === 0) {
            return {
                totalAssessments: 0,
                averageScore: 0,
                activeCountries: 0,
                byCountry: [],
                byBase: [],
                evolution: []
            };
        }

        const total = assessments.length;

        // Calculate global average score
        const sumScores = assessments.reduce((acc, curr) => acc + (curr.score || 0), 0);
        const avgScore = Math.round(sumScores / total);

        // Group by Country
        const countryMap = new Map<string, { count: number; sum: number }>();
        assessments.forEach(a => {
            const c = a.country || 'Unknown';
            const current = countryMap.get(c) || { count: 0, sum: 0 };
            current.count++;
            current.sum += (a.score || 0);
            countryMap.set(c, current);
        });

        const byCountry = Array.from(countryMap.entries()).map(([name, val]) => ({
            name,
            count: val.count,
            score: Math.round(val.sum / val.count)
        }));

        // Group by Base
        const baseMap = new Map<string, { count: number; sum: number }>();
        assessments.forEach(a => {
            const b = a.base || 'Unknown';
            const current = baseMap.get(b) || { count: 0, sum: 0 };
            current.count++;
            current.sum += (a.score || 0);
            baseMap.set(b, current);
        });

        const byBase = Array.from(baseMap.entries()).map(([name, val]) => ({
            name,
            count: val.count,
            score: Math.round(val.sum / val.count)
        }));

        // Evolution (by Month)
        const monthMap = new Map<string, { count: number; sum: number }>();
        assessments.forEach(a => {
            // expected format YYYY-MM
            const m = a.evaluationMonth || 'Unknown';
            const current = monthMap.get(m) || { count: 0, sum: 0 };
            current.count++;
            current.sum += (a.score || 0);
            monthMap.set(m, current);
        });

        // Sort by Date
        const evolution = Array.from(monthMap.entries())
            .sort((a, b) => a[0].localeCompare(b[0]))
            .map(([name, val]) => ({
                name,
                value: Math.round(val.sum / val.count)
            }));

        return {
            totalAssessments: total,
            averageScore: avgScore,
            activeCountries: byCountry.length,
            byCountry,
            byBase,
            evolution
        };
    }
}
