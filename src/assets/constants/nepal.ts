export const NEPAL_DATA = {
  countryCode: 'NP',
  name: 'Nepal',
  localName: 'नेपाल',
  population: 29136302,
  area: 147181,
  center: [84.1240, 28.3949] as [number, number],
  zoom: 6,
  geojsonFile: 'nepal.geojson',
  provinces: [
    {
      id: 'province1',
      name: 'Koshi Province',
      nameNepali: 'कोशी प्रदेश',
      population: 4535000,
      area: 25905,
      districts: [
        {
          id: 'sunsari',
          name: 'Sunsari',
          nameNepali: 'सुनसरी',
          population: 763497,
          area: 1254,
          municipalities: [
            { id: 'dharan_municipality', name: 'Dharan Municipality', nameNepali: 'धरान नगरपालिका', population: 173096, area: 192.3 },
            { id: 'itahari_municipality', name: 'Itahari Municipality', nameNepali: 'इटहरी नगरपालिका', population: 140517, area: 93.8 }
          ]
        },
        {
          id: 'morang',
          name: 'Morang',
          nameNepali: 'मोरङ',
          population: 965370,
          area: 1855,
          municipalities: [
            { id: 'biratnagar_municipality', name: 'Biratnagar Municipality', nameNepali: 'विराटनगर नगरपालिका', population: 204949, area: 77.0 },
            { id: 'biratchowk_municipality', name: 'Biratchowk Municipality', nameNepali: 'विराटचोक नगरपालिका', population: 204949, area: 77.0 }
          ]
        }
      ]
    },
    {
      id: 'province2', 
      name: 'Madhesh Province',
      nameNepali: 'मधेश प्रदेश',
      population: 6140000,
      area: 9661,
      districts: [
        {
          id: 'sarlahi',
          name: 'Sarlahi',
          nameNepali: 'सर्लाही',
          population: 769729,
          area: 1259,
          municipalities: [
            { id: 'malangwa_municipality', name: 'Malangwa Municipality', nameNepali: 'मलङ्वा नगरपालिका', population: 62789, area: 12.5 },
            { id: 'lalbandi_municipality', name: 'Lalbandi Municipality', nameNepali: 'लालबन्दी नगरपालिका', population: 45678, area: 8.9 }
          ]
        },
        {
          id: 'dhanusha',
          name: 'Dhanusha',
          nameNepali: 'धनुषा',
          population: 754777,
          area: 1180,
          municipalities: [
            { id: 'janakpur_municipality', name: 'Janakpur Municipality', nameNepali: 'जनकपुर नगरपालिका', population: 173924, area: 24.6 },
            { id: 'sabaila_municipality', name: 'Sabaila Municipality', nameNepali: 'सबैला नगरपालिका', population: 45678, area: 12.3 }
          ]
        }
      ]
    },
    {
      id: 'province3',
      name: 'Bagmati Province', 
      nameNepali: 'बागमती प्रदेश',
      population: 5520000,
      area: 20300,
      districts: [
        {
          id: 'kathmandu',
          name: 'Kathmandu',
          nameNepali: 'काठमाडौं',
          population: 2041078,
          area: 395,
          municipalities: [
            { id: 'kathmandu_municipality', name: 'Kathmandu Municipality', nameNepali: 'काठमाडौं महानगरपालिका', population: 845767, area: 50.67 },
            { id: 'lalitpur_municipality', name: 'Lalitpur Municipality', nameNepali: 'ललितपुर महानगरपालिका', population: 284922, area: 36.12 }
          ]
        },
        {
          id: 'bhaktapur',
          name: 'Bhaktapur',
          nameNepali: 'भक्तपुर',
          population: 304651,
          area: 119,
          municipalities: [
            { id: 'bhaktapur_municipality', name: 'Bhaktapur Municipality', nameNepali: 'भक्तपुर नगरपालिका', population: 304651, area: 6.89 },
            { id: 'madhyapur_municipality', name: 'Madhyapur Thimi Municipality', nameNepali: 'मध्यपुर थिमी नगरपालिका', population: 119955, area: 11.47 }
          ]
        }
      ]
    },
    {
      id: 'province4',
      name: 'Gandaki Province',
      nameNepali: 'गण्डकी प्रदेश', 
      population: 2400000,
      area: 21504,
      districts: [
        {
          id: 'kaski',
          name: 'Kaski',
          nameNepali: 'कास्की',
          population: 492098,
          area: 2017,
          municipalities: [
            { id: 'pokhara_municipality', name: 'Pokhara Municipality', nameNepali: 'पोखरा महानगरपालिका', population: 518452, area: 464.24 },
            { id: 'annapurna_municipality', name: 'Annapurna Municipality', nameNepali: 'अन्नपूर्ण नगरपालिका', population: 123927, area: 76.2 }
          ]
        },
        {
          id: 'lamjung',
          name: 'Lamjung',
          nameNepali: 'लमजुङ',
          population: 167724,
          area: 1692,
          municipalities: [
            { id: 'besishahar_municipality', name: 'Besishahar Municipality', nameNepali: 'बेसीशहर नगरपालिका', population: 45678, area: 12.5 },
            { id: 'madhyanepal_municipality', name: 'Madhya Nepal Municipality', nameNepali: 'मध्य नेपाल नगरपालिका', population: 23456, area: 8.9 }
          ]
        }
      ]
    },
    {
      id: 'province5',
      name: 'Lumbini Province',
      nameNepali: 'लुम्बिनी प्रदेश',
      population: 5000000,
      area: 22288,
      districts: [
        {
          id: 'rupandehi',
          name: 'Rupandehi',
          nameNepali: 'रुपन्देही',
          population: 880196,
          area: 1360,
          municipalities: [
            { id: 'siddharthanagar_municipality', name: 'Siddharthanagar Municipality', nameNepali: 'सिद्धार्थनगर नगरपालिका', population: 63426, area: 36.0 },
            { id: 'butwal_municipality', name: 'Butwal Municipality', nameNepali: 'बुटवल नगरपालिका', population: 118462, area: 101.61 }
          ]
        },
        {
          id: 'kapilvastu',
          name: 'Kapilvastu',
          nameNepali: 'कपिलवस्तु',
          population: 571936,
          area: 1738,
          municipalities: [
            { id: 'kapilvastu_municipality', name: 'Kapilvastu Municipality', nameNepali: 'कपिलवस्तु नगरपालिका', population: 45678, area: 12.5 },
            { id: 'buddhabhumi_municipality', name: 'Buddhabhumi Municipality', nameNepali: 'बुद्धभूमि नगरपालिका', population: 23456, area: 8.9 }
          ]
        }
      ]
    },
    {
      id: 'province6',
      name: 'Karnali Province',
      nameNepali: 'कर्णाली प्रदेश',
      population: 1700000,
      area: 27984,
      districts: [
        {
          id: 'jajarkot',
          name: 'Jajarkot',
          nameNepali: 'जाजरकोट',
          population: 134868,
          area: 2230,
          municipalities: [
            { id: 'khalanga_municipality', name: 'Khalanga Municipality', nameNepali: 'खलङ्गा नगरपालिका', population: 12345, area: 5.2 },
            { id: 'bheri_municipality', name: 'Bheri Municipality', nameNepali: 'भेरी नगरपालिका', population: 9876, area: 3.8 }
          ]
        },
        {
          id: 'dolpa',
          name: 'Dolpa',
          nameNepali: 'डोल्पा',
          population: 36689,
          area: 7889,
          municipalities: [
            { id: 'dunai_municipality', name: 'Dunai Municipality', nameNepali: 'दुनै नगरपालिका', population: 5432, area: 2.1 },
            { id: 'thuli_municipality', name: 'Thuli Bheri Municipality', nameNepali: 'थुली भेरी नगरपालिका', population: 3210, area: 1.5 }
          ]
        }
      ]
    },
    {
      id: 'province7',
      name: 'Sudurpashchim Province',
      nameNepali: 'सुदूरपश्चिम प्रदेश',
      population: 2600000,
      area: 19539,
      districts: [
        {
          id: 'kailali',
          name: 'Kailali',
          nameNepali: 'कैलाली',
          population: 775709,
          area: 3235,
          municipalities: [
            { id: 'dhangadhi_municipality', name: 'Dhangadhi Municipality', nameNepali: 'धनगढी नगरपालिका', population: 147741, area: 261.75 },
            { id: 'tikapur_municipality', name: 'Tikapur Municipality', nameNepali: 'टिकापुर नगरपालिका', population: 45678, area: 12.5 }
          ]
        },
        {
          id: 'kanchanpur',
          name: 'Kanchanpur',
          nameNepali: 'कञ्चनपुर',
          population: 451248,
          area: 1610,
          municipalities: [
            { id: 'bhimdatta_municipality', name: 'Bhimdatta Municipality', nameNepali: 'भीमदत्त नगरपालिका', population: 104599, area: 56.0 },
            { id: 'krishnapur_municipality', name: 'Krishnapur Municipality', nameNepali: 'कृष्णपुर नगरपालिका', population: 23456, area: 8.9 }
          ]
        }
      ]
    }
  ]
};
