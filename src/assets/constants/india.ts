export const INDIA_DATA = {
  countryCode: 'IN',
  name: 'India',
  localName: 'भारत',
  population: 1380004385,
  area: 3287263,
  center: [78.9629, 20.5937] as [number, number],
  zoom: 5,
  geojsonFile: 'india.geojson',
  states: [
    {
      id: 'andhra_pradesh',
      name: 'Andhra Pradesh',
      nameLocal: 'ఆంధ్ర ప్రదేశ్',
      population: 49577103,
      area: 160205,
      districts: [
        {
          id: 'anantapur',
          name: 'Anantapur',
          nameLocal: 'అనంతపురం',
          population: 4081148,
          area: 19130,
          municipalities: [
            { id: 'anantapur_municipality', name: 'Anantapur Municipality', nameLocal: 'అనంతపురం మునిసిపాలిటీ', population: 267161, area: 19.2 },
            { id: 'kadiri_municipality', name: 'Kadiri Municipality', nameLocal: 'కడిరి మునిసిపాలిటీ', population: 89429, area: 12.5 }
          ]
        },
        {
          id: 'chittoor',
          name: 'Chittoor',
          nameLocal: 'చిత్తూరు',
          population: 4174068,
          area: 15068,
          municipalities: [
            { id: 'tirupati_municipality', name: 'Tirupati Municipality', nameLocal: 'తిరుపతి మునిసిపాలిటీ', population: 287035, area: 27.5 },
            { id: 'chittoor_municipality', name: 'Chittoor Municipality', nameLocal: 'చిత్తూరు మునిసిపాలిటీ', population: 152654, area: 15.8 }
          ]
        }
      ]
    },
    {
      id: 'karnataka',
      name: 'Karnataka',
      nameLocal: 'ಕರ್ನಾಟಕ',
      population: 61130704,
      area: 191791,
      districts: [
        {
          id: 'bangalore_urban',
          name: 'Bangalore Urban',
          nameLocal: 'ಬೆಂಗಳೂರು ನಗರ',
          population: 9621551,
          area: 2190,
          municipalities: [
            { id: 'bangalore_municipality', name: 'Bangalore Municipality', nameLocal: 'ಬೆಂಗಳೂರು ಮಹಾನಗರ ಪಾಲಿಕೆ', population: 8443675, area: 741 },
            { id: 'yelahanka_municipality', name: 'Yelahanka Municipality', nameLocal: 'ಯಲಹಂಕ ಮಹಾನಗರ ಪಾಲಿಕೆ', population: 116447, area: 8.5 }
          ]
        },
        {
          id: 'mysore',
          name: 'Mysore',
          nameLocal: 'ಮೈಸೂರು',
          population: 3001127,
          area: 6307,
          municipalities: [
            { id: 'mysore_municipality', name: 'Mysore Municipality', nameLocal: 'ಮೈಸೂರು ಮಹಾನಗರ ಪಾಲಿಕೆ', population: 920550, area: 128.4 },
            { id: 'nanjangud_municipality', name: 'Nanjangud Municipality', nameLocal: 'ನಂಜನಗೂಡು ಮಹಾನಗರ ಪಾಲಿಕೆ', population: 61097, area: 12.5 }
          ]
        }
      ]
    },
    {
      id: 'maharashtra',
      name: 'Maharashtra',
      nameLocal: 'महाराष्ट्र',
      population: 112374333,
      area: 307713,
      districts: [
        {
          id: 'mumbai',
          name: 'Mumbai',
          nameLocal: 'मुंबई',
          population: 12442373,
          area: 603,
          municipalities: [
            { id: 'mumbai_municipality', name: 'Mumbai Municipality', nameLocal: 'मुंबई महानगर पालिका', population: 12442373, area: 603 },
            { id: 'thane_municipality', name: 'Thane Municipality', nameLocal: 'ठाणे महानगर पालिका', population: 1841088, area: 147 }
          ]
        },
        {
          id: 'pune',
          name: 'Pune',
          nameLocal: 'पुणे',
          population: 9429408,
          area: 15643,
          municipalities: [
            { id: 'pune_municipality', name: 'Pune Municipality', nameLocal: 'पुणे महानगर पालिका', population: 3124458, area: 331.3 },
            { id: 'pimpri_municipality', name: 'Pimpri-Chinchwad Municipality', nameLocal: 'पिंपरी-चिंचवड महानगर पालिका', population: 1727692, area: 171.5 }
          ]
        }
      ]
    },
    {
      id: 'tamil_nadu',
      name: 'Tamil Nadu',
      nameLocal: 'தமிழ்நாடு',
      population: 72147030,
      area: 130058,
      districts: [
        {
          id: 'chennai',
          name: 'Chennai',
          nameLocal: 'சென்னை',
          population: 7090000,
          area: 426,
          municipalities: [
            { id: 'chennai_municipality', name: 'Chennai Municipality', nameLocal: 'சென்னை மாநகராட்சி', population: 7090000, area: 426 },
            { id: 'tambaram_municipality', name: 'Tambaram Municipality', nameLocal: 'தாம்பரம் மாநகராட்சி', population: 174549, area: 87.1 }
          ]
        },
        {
          id: 'coimbatore',
          name: 'Coimbatore',
          nameLocal: 'கோயம்புத்தூர்',
          population: 3458045,
          area: 7462,
          municipalities: [
            { id: 'coimbatore_municipality', name: 'Coimbatore Municipality', nameLocal: 'கோயம்புத்தூர் மாநகராட்சி', population: 1050722, area: 246.8 },
            { id: 'tiruppur_municipality', name: 'Tiruppur Municipality', nameLocal: 'திருப்பூர் மாநகராட்சி', population: 444543, area: 159.6 }
          ]
        }
      ]
    }
  ]
};
