import { Injectable } from '@angular/core';
import { ActivatedRoute, Router, NavigationEnd } from '@angular/router';
import { BehaviorSubject, Observable } from 'rxjs';
import { filter } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class QueryParamService {
  private countrySubject = new BehaviorSubject<string>('');
  private provinceSubject = new BehaviorSubject<string>('');
  private districtSubject = new BehaviorSubject<string>('');
  private municipalitySubject = new BehaviorSubject<string>('');
  private wardSubject = new BehaviorSubject<string>('');

  public country$ = this.countrySubject.asObservable();
  public province$ = this.provinceSubject.asObservable();
  public district$ = this.districtSubject.asObservable();
  public municipality$ = this.municipalitySubject.asObservable();
  public ward$ = this.wardSubject.asObservable();

  constructor(
    private router: Router,
    private route: ActivatedRoute
  ) {
    // Listen to route changes to update all parameters
    this.router.events
      .pipe(filter(event => event instanceof NavigationEnd))
      .subscribe(() => {
        this.updateAllFromQuery();
      });

    // Initial load
    this.updateAllFromQuery();
  }

  private updateAllFromQuery() {
    this.route.queryParams.subscribe(params => {
      this.countrySubject.next(params['country'] || '');
      this.provinceSubject.next(params['province'] || '');
      this.districtSubject.next(params['district'] || '');
      this.municipalitySubject.next(params['municipality'] || '');
      this.wardSubject.next(params['ward'] || '');
    });
  }

  setCountry(country: string) {
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { 
        country: country,
      },
      queryParamsHandling: 'merge'
    });
  }

  setProvince(province: string) {
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { 
        province: province,
      },
      queryParamsHandling: 'merge'
    });
  }

  setDistrict(district: string) {
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { 
        district: district,
      },
      queryParamsHandling: 'merge'
    });
  }

  setMunicipality(municipality: string) {
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { 
        municipality: municipality,
      },
      queryParamsHandling: 'merge'
    });
  }

  setWard(ward: string) {
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { ward: ward },
      queryParamsHandling: 'merge'
    });
  }

  getCurrentCountry(): string {
    return this.countrySubject.value;
  }

  getCurrentProvince(): string {
    return this.provinceSubject.value;
  }

  getCurrentDistrict(): string {
    return this.districtSubject.value;
  }

  getCurrentMunicipality(): string {
    return this.municipalitySubject.value;
  }

  getCurrentWard(): string {
    return this.wardSubject.value;
  }
}
