import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

@Injectable({
    providedIn: 'root'
})
export class CloudinaryService {
    private http = inject(HttpClient);

    // Configuration
    private cloudName = 'debspsk3w';
    private uploadPreset = 'elat_uploads'; // Unsigned
    private uploadUrl = `https://api.cloudinary.com/v1_1/${this.cloudName}/image/upload`;

    uploadPhoto(file: File): Observable<string> {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('upload_preset', this.uploadPreset);
        formData.append('folder', 'E-LAT'); // Explicitly set folder just in case

        return this.http.post<any>(this.uploadUrl, formData).pipe(
            map(response => response.secure_url)
        );
    }
}
