import { Injectable } from '@angular/core';
import { ActivatedRoute, Router, NavigationEnd } from '@angular/router';
import { BehaviorSubject, Observable } from 'rxjs';
import { filter } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class QueryParamService {
  private countrySubject = new BehaviorSubject<string>('nepal');
  public country$ = this.countrySubject.asObservable();

  constructor(
    private router: Router,
    private route: ActivatedRoute
  ) {
    // Listen to route changes to update country
    this.router.events
      .pipe(filter(event => event instanceof NavigationEnd))
      .subscribe(() => {
        this.updateCountryFromQuery();
      });

    // Initial load
    this.updateCountryFromQuery();
  }

  private updateCountryFromQuery() {
    this.route.queryParams.subscribe(params => {
      const country = params['country'] || 'nepal';
      this.countrySubject.next(country);
    });
  }

  setCountry(country: string) {
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { country: country },
      queryParamsHandling: 'merge'
    });
  }

  getCurrentCountry(): string {
    return this.countrySubject.value;
  }
}
