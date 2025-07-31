// src/app/services/news.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment'; 

@Injectable({
  providedIn: 'root'
})
export class NewsService {
  private apiKey = environment.newsApiKey;
  private apiUrl = 'https://newsapi.org/v2';

  constructor(private http: HttpClient) { }

  getTopHeadlines(country: string = 'us') {
    return this.http.get(`${this.apiUrl}/top-headlines?country=${country}&apiKey=${this.apiKey}`);
  }

  searchNews(query: string) {
    return this.http.get(`${this.apiUrl}/everything?q=${query}&apiKey=${this.apiKey}`);
  }

  getSources() {
    return this.http.get(`${this.apiUrl}/sources?apiKey=${this.apiKey}`);
  }
}