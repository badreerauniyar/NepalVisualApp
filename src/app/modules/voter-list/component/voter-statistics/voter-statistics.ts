import { Component, OnInit, Input, OnChanges, SimpleChanges, ChangeDetectorRef, AfterViewInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Chart, ChartConfiguration, ChartType, registerables } from 'chart.js';
import { Voter } from '../voter-table/voter-table';

Chart.register(...registerables);

export interface AgeGroup {
  label: string;
  min: number;
  max: number;
}

@Component({
  selector: 'app-voter-statistics',
  templateUrl: './voter-statistics.html',
  styleUrl: './voter-statistics.scss',
  standalone: false
})
export class VoterStatistics implements OnInit, OnChanges, AfterViewInit, OnDestroy {
  @Input() voters: Voter[] = [];

  // Chart instances
  genderChart: Chart | null = null;
  ageGroupChart: Chart | null = null;
  ageGenderChart: Chart | null = null;
  maritalStatusChart: Chart | null = null;
  agePyramidChart: Chart | null = null;
  religionPieChart: Chart | null = null;
  religionBarChart: Chart | null = null;
  castePieChart: Chart | null = null;
  casteBarChart: Chart | null = null;

  // Age groups
  ageGroups: AgeGroup[] = [
    { label: '18-25', min: 18, max: 25 },
    { label: '26-35', min: 26, max: 35 },
    { label: '36-45', min: 36, max: 45 },
    { label: '46-55', min: 46, max: 55 },
    { label: '56-65', min: 56, max: 65 },
    { label: '66+', min: 66, max: 150 }
  ];

  // Statistics data
  genderStats: { male: number; female: number; other: number } = { male: 0, female: 0, other: 0 };
  ageGroupStats: { [key: string]: number } = {};
  maritalStats: { married: number; single: number } = { married: 0, single: 0 };
  ageGenderStats: { [key: string]: { male: number; female: number } } = {};
  religionStats: { [key: string]: number } = {};
  casteStats: { [key: string]: number } = {};

  constructor(
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit() {
    this.processData();
  }

  ngAfterViewInit() {
    this.createCharts();
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['voters'] && !changes['voters'].firstChange) {
      this.processData();
      setTimeout(() => {
        this.createCharts();
      }, 100);
    }
  }

  processData() {
    // Reset stats
    this.genderStats = { male: 0, female: 0, other: 0 };
    this.ageGroupStats = {};
    this.maritalStats = { married: 0, single: 0 };
    this.ageGenderStats = {};
    this.religionStats = {};
    this.casteStats = {};

    // Initialize age groups
    this.ageGroups.forEach(group => {
      this.ageGroupStats[group.label] = 0;
      this.ageGenderStats[group.label] = { male: 0, female: 0 };
    });

    // Process each voter
    this.voters.forEach(voter => {
      // Gender statistics
      const gender = voter.gender?.toLowerCase() || '';
      if (gender.includes('पुरुष') || gender.includes('male') || gender.includes('पुरूष')) {
        this.genderStats.male++;
      } else if (gender.includes('महिला') || gender.includes('female')) {
        this.genderStats.female++;
      } else {
        this.genderStats.other++;
      }

      // Age group statistics
      if (voter.age) {
        const ageGroup = this.getAgeGroup(voter.age);
        if (ageGroup) {
          this.ageGroupStats[ageGroup]++;
          
          // Age group by gender
          if (gender.includes('पुरुष') || gender.includes('male') || gender.includes('पुरूष')) {
            this.ageGenderStats[ageGroup].male++;
          } else if (gender.includes('महिला') || gender.includes('female')) {
            this.ageGenderStats[ageGroup].female++;
          }
        }
      }

      // Marital status (married if has spouse_name)
      if (voter.spouse_name && voter.spouse_name.trim() !== '') {
        this.maritalStats.married++;
      } else {
        this.maritalStats.single++;
      }

      // Religion and Caste - use stored values directly from database/JSON
      const religion = voter.religion || 'Unknown';
      const caste = voter.caste || 'Unknown';

      // Count religion
      this.religionStats[religion] = (this.religionStats[religion] || 0) + 1;

      // Count caste
      this.casteStats[caste] = (this.casteStats[caste] || 0) + 1;
    });
  }

  getAgeGroup(age: number): string | null {
    for (const group of this.ageGroups) {
      if (age >= group.min && age <= group.max) {
        return group.label;
      }
    }
    return null;
  }

  createCharts() {
    this.destroyCharts();
    
    setTimeout(() => {
      this.createGenderChart();
      this.createAgeGroupChart();
      this.createAgeGenderChart();
      this.createMaritalStatusChart();
      this.createAgePyramidChart();
      this.createReligionPieChart();
      this.createReligionBarChart();
      this.createCastePieChart();
      this.createCasteBarChart();
    }, 50);
  }

  destroyCharts() {
    if (this.genderChart) {
      this.genderChart.destroy();
      this.genderChart = null;
    }
    if (this.ageGroupChart) {
      this.ageGroupChart.destroy();
      this.ageGroupChart = null;
    }
    if (this.ageGenderChart) {
      this.ageGenderChart.destroy();
      this.ageGenderChart = null;
    }
    if (this.maritalStatusChart) {
      this.maritalStatusChart.destroy();
      this.maritalStatusChart = null;
    }
    if (this.agePyramidChart) {
      this.agePyramidChart.destroy();
      this.agePyramidChart = null;
    }
    if (this.religionPieChart) {
      this.religionPieChart.destroy();
      this.religionPieChart = null;
    }
    if (this.religionBarChart) {
      this.religionBarChart.destroy();
      this.religionBarChart = null;
    }
    if (this.castePieChart) {
      this.castePieChart.destroy();
      this.castePieChart = null;
    }
    if (this.casteBarChart) {
      this.casteBarChart.destroy();
      this.casteBarChart = null;
    }
  }

  createGenderChart() {
    const ctx = document.getElementById('genderChart') as HTMLCanvasElement;
    if (!ctx) return;

    const total = this.genderStats.male + this.genderStats.female + this.genderStats.other;
    const data = [this.genderStats.male, this.genderStats.female, this.genderStats.other];

    const config: ChartConfiguration = {
      type: 'pie',
      data: {
        labels: ['Male / पुरुष', 'Female / महिला', 'Other'],
        datasets: [{
          data: data,
          backgroundColor: ['#3b82f6', '#ec4899', '#6b7280'],
          borderWidth: 2,
          borderColor: '#fff'
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'bottom',
            align: 'start',
            labels: {
              boxWidth: 10,
              padding: 5,
              font: {
                size: 10
              },
              generateLabels: (chart: any) => {
                const data = chart.data;
                if (data.labels.length && data.datasets.length) {
                  return data.labels.map((label: string, i: number) => {
                    const value = data.datasets[0].data[i];
                    const percentage = total > 0 ? ((value / total) * 100).toFixed(1) : '0.0';
                    return {
                      text: `${label}: ${value} (${percentage}%)`,
                      fillStyle: data.datasets[0].backgroundColor[i],
                      hidden: false,
                      index: i
                    };
                  });
                }
                return [];
              }
            }
          },
          title: {
            display: true,
            text: 'Gender Distribution / लिङ्ग वितरण'
          },
          tooltip: {
            callbacks: {
              label: (context: any) => {
                const label = context.label || '';
                const value = context.parsed || 0;
                const percentage = total > 0 ? ((value / total) * 100).toFixed(1) : '0.0';
                return `${label}: ${value} (${percentage}%)`;
              }
            }
          }
        }
      }
    };

    this.genderChart = new Chart(ctx, config);
  }

  createAgeGroupChart() {
    const ctx = document.getElementById('ageGroupChart') as HTMLCanvasElement;
    if (!ctx) return;

    const labels = Object.keys(this.ageGroupStats);
    const data = labels.map(label => this.ageGroupStats[label]);
    const total = data.reduce((sum, val) => sum + val, 0);

    const config: ChartConfiguration = {
      type: 'bar',
      data: {
        labels: labels,
        datasets: [{
          label: 'Voters',
          data: data,
          backgroundColor: '#10b981',
          borderColor: '#059669',
          borderWidth: 1
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: true,
            position: 'bottom',
            align: 'start',
            labels: {
              boxWidth: 10,
              padding: 5,
              font: {
                size: 10
              },
              generateLabels: (chart: any) => {
                const labels = chart.data.labels;
                const data = chart.data.datasets[0].data;
                const total = data.reduce((sum: number, val: number) => sum + val, 0);
                const legendItems = labels.map((label: string, i: number) => {
                  const value = data[i];
                  const percentage = total > 0 ? ((value / total) * 100).toFixed(1) : '0.0';
                  return {
                    text: `${label}: ${value} (${percentage}%)`,
                    fillStyle: '#10b981',
                    hidden: false,
                    index: i
                  };
                });
                return legendItems;
              }
            }
          },
          title: {
            display: true,
            text: 'Age Group Distribution / उमेर समूह वितरण'
          },
          tooltip: {
            callbacks: {
              label: (context: any) => {
                const label = context.label || '';
                const value = context.parsed.y || 0;
                const percentage = total > 0 ? ((value / total) * 100).toFixed(1) : '0.0';
                return `${label}: ${value} (${percentage}%)`;
              }
            }
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            ticks: {
              stepSize: 1
            }
          }
        }
      }
    };

    this.ageGroupChart = new Chart(ctx, config);
  }

  createAgeGenderChart() {
    const ctx = document.getElementById('ageGenderChart') as HTMLCanvasElement;
    if (!ctx) return;

    const labels = Object.keys(this.ageGenderStats);
    const maleData = labels.map(label => this.ageGenderStats[label].male);
    const femaleData = labels.map(label => this.ageGenderStats[label].female);
    const totalMale = maleData.reduce((sum, val) => sum + val, 0);
    const totalFemale = femaleData.reduce((sum, val) => sum + val, 0);
    const grandTotal = totalMale + totalFemale;

    const config: ChartConfiguration = {
      type: 'bar',
      data: {
        labels: labels,
        datasets: [
          {
            label: 'Male / पुरुष',
            data: maleData,
            backgroundColor: '#3b82f6',
            borderColor: '#2563eb',
            borderWidth: 1
          },
          {
            label: 'Female / महिला',
            data: femaleData,
            backgroundColor: '#ec4899',
            borderColor: '#db2777',
            borderWidth: 1
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'bottom',
            align: 'start',
            labels: {
              boxWidth: 10,
              padding: 5,
              font: {
                size: 10
              },
              generateLabels: (chart: any) => {
                const labels = chart.data.labels;
                const datasets = chart.data.datasets;
                const legendItems: any[] = [];
                
                // Create legend items for each age group showing both male and female
                labels.forEach((label: string, i: number) => {
                  const maleValue = datasets[0].data[i];
                  const femaleValue = datasets[1].data[i];
                  const groupTotal = maleValue + femaleValue;
                  const percentage = grandTotal > 0 ? ((groupTotal / grandTotal) * 100).toFixed(1) : '0.0';
                  
                  legendItems.push({
                    text: `${label}: M:${maleValue} F:${femaleValue} (${percentage}%)`,
                    fillStyle: datasets[0].backgroundColor,
                    hidden: false,
                    index: i
                  });
                });
                
                return legendItems;
              }
            }
          },
          title: {
            display: true,
            text: 'Age Groups by Gender / लिङ्ग अनुसार उमेर समूह'
          },
          tooltip: {
            callbacks: {
              label: (context: any) => {
                const label = context.dataset.label || '';
                const value = context.parsed.y || 0;
                const datasetTotal = context.dataset.data.reduce((sum: number, val: number) => sum + val, 0);
                const percentage = datasetTotal > 0 ? ((value / datasetTotal) * 100).toFixed(1) : '0.0';
                return `${label}: ${value} (${percentage}% of ${label})`;
              }
            }
          }
        },
        scales: {
          x: {
            stacked: false
          },
          y: {
            beginAtZero: true,
            stacked: false
          }
        }
      }
    };

    this.ageGenderChart = new Chart(ctx, config);
  }

  createMaritalStatusChart() {
    const ctx = document.getElementById('maritalStatusChart') as HTMLCanvasElement;
    if (!ctx) return;

    const total = this.maritalStats.married + this.maritalStats.single;
    const data = [this.maritalStats.married, this.maritalStats.single];

    const config: ChartConfiguration = {
      type: 'doughnut',
      data: {
        labels: ['Married / विवाहित', 'Single / अविवाहित'],
        datasets: [{
          data: data,
          backgroundColor: ['#8b5cf6', '#f59e0b'],
          borderWidth: 2,
          borderColor: '#fff'
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'bottom',
            align: 'start',
            labels: {
              boxWidth: 10,
              padding: 5,
              font: {
                size: 10
              },
              generateLabels: (chart: any) => {
                const data = chart.data;
                if (data.labels.length && data.datasets.length) {
                  return data.labels.map((label: string, i: number) => {
                    const value = data.datasets[0].data[i];
                    const percentage = total > 0 ? ((value / total) * 100).toFixed(1) : '0.0';
                    return {
                      text: `${label}: ${value} (${percentage}%)`,
                      fillStyle: data.datasets[0].backgroundColor[i],
                      hidden: false,
                      index: i
                    };
                  });
                }
                return [];
              }
            }
          },
          title: {
            display: true,
            text: 'Marital Status / वैवाहिक स्थिति'
          },
          tooltip: {
            callbacks: {
              label: (context: any) => {
                const label = context.label || '';
                const value = context.parsed || 0;
                const percentage = total > 0 ? ((value / total) * 100).toFixed(1) : '0.0';
                return `${label}: ${value} (${percentage}%)`;
              }
            }
          }
        }
      }
    };

    this.maritalStatusChart = new Chart(ctx, config);
  }

  createAgePyramidChart() {
    const ctx = document.getElementById('agePyramidChart') as HTMLCanvasElement;
    if (!ctx) return;

    const labels = Object.keys(this.ageGenderStats);
    const maleData = labels.map(label => -this.ageGenderStats[label].male); // Negative for left side
    const femaleData = labels.map(label => this.ageGenderStats[label].female); // Positive for right side
    const totalMale = Math.abs(maleData.reduce((sum, val) => sum + val, 0));
    const totalFemale = femaleData.reduce((sum, val) => sum + val, 0);
    const grandTotal = totalMale + totalFemale;

    const config: ChartConfiguration = {
      type: 'bar',
      data: {
        labels: labels,
        datasets: [
          {
            label: 'Male / पुरुष',
            data: maleData,
            backgroundColor: '#3b82f6',
            borderColor: '#2563eb',
            borderWidth: 1
          },
          {
            label: 'Female / महिला',
            data: femaleData,
            backgroundColor: '#ec4899',
            borderColor: '#db2777',
            borderWidth: 1
          }
        ]
      },
      options: {
        indexAxis: 'y',
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'top',
            labels: {
              generateLabels: (chart: any) => {
                const datasets = chart.data.datasets;
                return datasets.map((dataset: any, i: number) => {
                  const total = Math.abs(dataset.data.reduce((sum: number, val: number) => sum + val, 0));
                  const percentage = grandTotal > 0 ? ((total / grandTotal) * 100).toFixed(1) : '0.0';
                  return {
                    text: `${dataset.label}: ${total} (${percentage}%)`,
                    fillStyle: dataset.backgroundColor,
                    hidden: false,
                    index: i
                  };
                });
              }
            }
          },
          title: {
            display: true,
            text: 'Age Pyramid / उमेर पिरामिड'
          },
          tooltip: {
            callbacks: {
              label: (context: any) => {
                const value = context.parsed.x !== null ? Math.abs(context.parsed.x) : 0;
                const datasetTotal = Math.abs(context.dataset.data.reduce((sum: number, val: number) => sum + val, 0));
                const percentage = datasetTotal > 0 ? ((value / datasetTotal) * 100).toFixed(1) : '0.0';
                return `${context.dataset.label}: ${value} (${percentage}% of ${context.dataset.label})`;
              }
            }
          }
        },
        scales: {
          x: {
            beginAtZero: true,
            ticks: {
              callback: (value) => {
                return Math.abs(Number(value));
              }
            }
          }
        }
      }
    };

    this.agePyramidChart = new Chart(ctx, config);
  }

  createReligionPieChart() {
    const ctx = document.getElementById('religionPieChart') as HTMLCanvasElement;
    if (!ctx) return;

    const labels = Object.keys(this.religionStats).filter(key => this.religionStats[key] > 0);
    const data = labels.map(label => this.religionStats[label]);

    if (labels.length === 0) return;

    const total = data.reduce((sum, val) => sum + val, 0);
    const colors = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#6b7280'];
    
    const config: ChartConfiguration = {
      type: 'pie',
      data: {
        labels: labels,
        datasets: [{
          data: data,
          backgroundColor: colors.slice(0, labels.length),
          borderWidth: 2,
          borderColor: '#fff'
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'bottom',
            align: 'start',
            labels: {
              boxWidth: 10,
              padding: 5,
              font: {
                size: 10
              },
              generateLabels: (chart: any) => {
                const data = chart.data;
                if (data.labels.length && data.datasets.length) {
                  return data.labels.map((label: string, i: number) => {
                    const value = data.datasets[0].data[i];
                    const percentage = total > 0 ? ((value / total) * 100).toFixed(1) : '0.0';
                    return {
                      text: `${label}: ${value} (${percentage}%)`,
                      fillStyle: data.datasets[0].backgroundColor[i],
                      hidden: false,
                      index: i
                    };
                  });
                }
                return [];
              }
            }
          },
          title: {
            display: true,
            text: 'Religion Distribution / धर्म वितरण (Pie Chart)'
          },
          tooltip: {
            callbacks: {
              label: (context: any) => {
                const label = context.label || '';
                const value = context.parsed || 0;
                const percentage = total > 0 ? ((value / total) * 100).toFixed(1) : '0.0';
                return `${label}: ${value} (${percentage}%)`;
              }
            }
          }
        }
      }
    };

    this.religionPieChart = new Chart(ctx, config);
  }

  createReligionBarChart() {
    const ctx = document.getElementById('religionBarChart') as HTMLCanvasElement;
    if (!ctx) return;

    const labels = Object.keys(this.religionStats)
      .filter(key => this.religionStats[key] > 0)
      .sort((a, b) => this.religionStats[b] - this.religionStats[a]);
    const data = labels.map(label => this.religionStats[label]);

    if (labels.length === 0) return;

    const total = data.reduce((sum, val) => sum + val, 0);

    const config: ChartConfiguration = {
      type: 'bar',
      data: {
        labels: labels,
        datasets: [{
          label: 'Voters',
          data: data,
          backgroundColor: '#8b5cf6',
          borderColor: '#7c3aed',
          borderWidth: 1
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: true,
            position: 'bottom',
            align: 'start',
            labels: {
              boxWidth: 10,
              padding: 5,
              font: {
                size: 10
              },
              generateLabels: (chart: any) => {
                const labels = chart.data.labels;
                const data = chart.data.datasets[0].data;
                const total = data.reduce((sum: number, val: number) => sum + val, 0);
                const legendItems = labels.map((label: string, i: number) => {
                  const value = data[i];
                  const percentage = total > 0 ? ((value / total) * 100).toFixed(1) : '0.0';
                  return {
                    text: `${label}: ${value} (${percentage}%)`,
                    fillStyle: '#8b5cf6',
                    hidden: false,
                    index: i
                  };
                });
                return legendItems;
              }
            }
          },
          title: {
            display: true,
            text: 'Religion Distribution / धर्म वितरण (Bar Chart)'
          },
          tooltip: {
            callbacks: {
              label: (context: any) => {
                const label = context.label || '';
                const value = context.parsed.y || 0;
                const percentage = total > 0 ? ((value / total) * 100).toFixed(1) : '0.0';
                return `${label}: ${value} (${percentage}%)`;
              }
            }
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            ticks: {
              stepSize: 1
            }
          }
        }
      }
    };

    this.religionBarChart = new Chart(ctx, config);
  }

  createCastePieChart() {
    const ctx = document.getElementById('castePieChart') as HTMLCanvasElement;
    if (!ctx) return;

    const labels = Object.keys(this.casteStats)
      .filter(key => this.casteStats[key] > 0)
      .sort((a, b) => this.casteStats[b] - this.casteStats[a])
      .slice(0, 10); // Top 10 castes
    const data = labels.map(label => this.casteStats[label]);

    if (labels.length === 0) return;

    const total = data.reduce((sum, val) => sum + val, 0);
    const colors = [
      '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6',
      '#ec4899', '#06b6d4', '#84cc16', '#f97316', '#6366f1'
    ];

    const config: ChartConfiguration = {
      type: 'pie',
      data: {
        labels: labels,
        datasets: [{
          data: data,
          backgroundColor: colors.slice(0, labels.length),
          borderWidth: 2,
          borderColor: '#fff'
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'bottom',
            align: 'start',
            labels: {
              boxWidth: 10,
              padding: 5,
              font: {
                size: 10
              },
              generateLabels: (chart: any) => {
                const data = chart.data;
                if (data.labels.length && data.datasets.length) {
                  return data.labels.map((label: string, i: number) => {
                    const value = data.datasets[0].data[i];
                    const percentage = total > 0 ? ((value / total) * 100).toFixed(1) : '0.0';
                    return {
                      text: `${label}: ${value} (${percentage}%)`,
                      fillStyle: data.datasets[0].backgroundColor[i],
                      hidden: false,
                      index: i
                    };
                  });
                }
                return [];
              }
            }
          },
          title: {
            display: true,
            text: 'Caste Distribution / जाति वितरण (Pie Chart - Top 10)'
          },
          tooltip: {
            callbacks: {
              label: (context: any) => {
                const label = context.label || '';
                const value = context.parsed || 0;
                const percentage = total > 0 ? ((value / total) * 100).toFixed(1) : '0.0';
                return `${label}: ${value} (${percentage}%)`;
              }
            }
          }
        }
      }
    };

    this.castePieChart = new Chart(ctx, config);
  }

  createCasteBarChart() {
    const ctx = document.getElementById('casteBarChart') as HTMLCanvasElement;
    if (!ctx) return;

    const labels = Object.keys(this.casteStats)
      .filter(key => this.casteStats[key] > 0)
      .sort((a, b) => this.casteStats[b] - this.casteStats[a])
      .slice(0, 15); // Top 15 castes
    const data = labels.map(label => this.casteStats[label]);

    if (labels.length === 0) return;

    const total = data.reduce((sum, val) => sum + val, 0);

    const config: ChartConfiguration = {
      type: 'bar',
      data: {
        labels: labels,
        datasets: [{
          label: 'Voters',
          data: data,
          backgroundColor: '#10b981',
          borderColor: '#059669',
          borderWidth: 1
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: true,
            position: 'bottom',
            align: 'start',
            labels: {
              boxWidth: 10,
              padding: 5,
              font: {
                size: 10
              },
              generateLabels: (chart: any) => {
                const labels = chart.data.labels;
                const data = chart.data.datasets[0].data;
                const total = data.reduce((sum: number, val: number) => sum + val, 0);
                const legendItems = labels.map((label: string, i: number) => {
                  const value = data[i];
                  const percentage = total > 0 ? ((value / total) * 100).toFixed(1) : '0.0';
                  return {
                    text: `${label}: ${value} (${percentage}%)`,
                    fillStyle: '#10b981',
                    hidden: false,
                    index: i
                  };
                });
                return legendItems;
              }
            }
          },
          title: {
            display: true,
            text: 'Caste Distribution / जाति वितरण (Bar Chart - Top 15)'
          },
          tooltip: {
            callbacks: {
              label: (context: any) => {
                const label = context.label || '';
                const value = context.parsed.y || 0;
                const percentage = total > 0 ? ((value / total) * 100).toFixed(1) : '0.0';
                return `${label}: ${value} (${percentage}%)`;
              }
            }
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            ticks: {
              stepSize: 1
            }
          },
          x: {
            ticks: {
              maxRotation: 45,
              minRotation: 45
            }
          }
        }
      }
    };

    this.casteBarChart = new Chart(ctx, config);
  }

  ngOnDestroy() {
    this.destroyCharts();
  }
}

