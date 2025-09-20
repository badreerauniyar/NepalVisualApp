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
      const country = params['country'] || '';
      const province = params['province'] || '';
      const district = params['district'] || '';
      const municipality = params['municipality'] || '';
      const ward = params['ward'] || '';

      // Only emit if values have changed to prevent unnecessary updates
      if (this.countrySubject.value !== country) {
        this.countrySubject.next(country);
      }
      if (this.provinceSubject.value !== province) {
        this.provinceSubject.next(province);
      }
      if (this.districtSubject.value !== district) {
        this.districtSubject.next(district);
      }
      if (this.municipalitySubject.value !== municipality) {
        this.municipalitySubject.next(municipality);
      }
      if (this.wardSubject.value !== ward) {
        this.wardSubject.next(ward);
      }
    });
  }

  setCountry(country: string) {
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { 
        country: country,
      }
    });
  }

  setProvince(province: string) {
    this.provinceSubject.next(province);
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { 
        country:this.countrySubject.value,
        province: province,
      },
    });
  }

  setDistrict(district: string) {
    this.districtSubject.next(district);
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { 
        country:this.countrySubject.value,
        province: this.provinceSubject.value,
        district: district,
      },
    });
  }

  setMunicipality(municipality: string) {
    this.municipalitySubject.next(municipality);
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { 
        country:this.countrySubject.value,
        province: this.provinceSubject.value,
        district: this.districtSubject.value,
        municipality: municipality,
      },
    });
  }

  setWard(ward: string) {
    this.wardSubject.next(ward);
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { 
        country:this.countrySubject.value,
        province: this.provinceSubject.value,
        district: this.districtSubject.value,
        municipality: this.municipalitySubject.value,
        ward: ward },
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
