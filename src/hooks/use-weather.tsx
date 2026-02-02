import { useState, useEffect } from "react";

interface WeatherData {
  id_stacji: string;
  stacja: string;
  temperatura: string;
  predkosc_wiatru: string;
  kierunek_wiatru: string;
  wilgotnosc_wzgledna: string;
  suma_opadu: string;
  cisnienie: string | null;
  data_pomiaru: string;
  godzina_pomiaru: string;
}

interface WeatherState {
  data: WeatherData | null;
  isLoading: boolean;
  error: string | null;
}

// Station coordinates for finding nearest station
interface StationCoords {
  id: string;
  name: string;
  lat: number;
  lon: number;
}

const STATIONS: StationCoords[] = [
  { id: "12295", name: "Białystok", lat: 53.1325, lon: 23.1688 },
  { id: "12600", name: "Bielsko Biała", lat: 49.8225, lon: 19.0444 },
  { id: "12235", name: "Chojnice", lat: 53.6972, lon: 17.5631 },
  { id: "12550", name: "Częstochowa", lat: 50.8118, lon: 19.1203 },
  { id: "12160", name: "Elbląg", lat: 54.1522, lon: 19.4044 },
  { id: "12155", name: "Gdańsk", lat: 54.3520, lon: 18.6466 },
  { id: "12300", name: "Gorzów", lat: 52.7368, lon: 15.2288 },
  { id: "12135", name: "Hel", lat: 54.6083, lon: 18.8012 },
  { id: "12500", name: "Jelenia Góra", lat: 50.9044, lon: 15.7197 },
  { id: "12435", name: "Kalisz", lat: 51.7611, lon: 18.0919 },
  { id: "12650", name: "Kasprowy Wierch", lat: 49.2319, lon: 19.9817 },
  { id: "12560", name: "Katowice", lat: 50.2649, lon: 19.0238 },
  { id: "12185", name: "Kętrzyn", lat: 54.0761, lon: 21.3747 },
  { id: "12570", name: "Kielce", lat: 50.8661, lon: 20.6286 },
  { id: "12520", name: "Kłodzko", lat: 50.4347, lon: 16.6614 },
  { id: "12345", name: "Koło", lat: 52.2006, lon: 18.6361 },
  { id: "12100", name: "Kołobrzeg", lat: 54.1758, lon: 15.5833 },
  { id: "12105", name: "Koszalin", lat: 54.1944, lon: 16.1722 },
  { id: "12488", name: "Kozienice", lat: 51.5836, lon: 21.5583 },
  { id: "12566", name: "Kraków", lat: 50.0647, lon: 19.9450 },
  { id: "12670", name: "Krosno", lat: 49.6886, lon: 21.7700 },
  { id: "12415", name: "Legnica", lat: 51.2070, lon: 16.1619 },
  { id: "12690", name: "Lesko", lat: 49.4700, lon: 22.3289 },
  { id: "12418", name: "Leszno", lat: 51.8400, lon: 16.5756 },
  { id: "12125", name: "Lębork", lat: 54.5392, lon: 17.7483 },
  { id: "12495", name: "Lublin", lat: 51.2465, lon: 22.5684 },
  { id: "12120", name: "Łeba", lat: 54.7536, lon: 17.5314 },
  { id: "12465", name: "Łódź", lat: 51.7592, lon: 19.4550 },
  { id: "12280", name: "Mikołajki", lat: 53.8017, lon: 21.5708 },
  { id: "12270", name: "Mława", lat: 53.1119, lon: 20.3769 },
  { id: "12660", name: "Nowy Sącz", lat: 49.6250, lon: 20.6903 },
  { id: "12272", name: "Olsztyn", lat: 53.7792, lon: 20.4942 },
  { id: "12530", name: "Opole", lat: 50.6751, lon: 17.9213 },
  { id: "12285", name: "Ostrołęka", lat: 53.0842, lon: 21.5742 },
  { id: "12230", name: "Piła", lat: 53.1519, lon: 16.7383 },
  { id: "12360", name: "Płock", lat: 52.5464, lon: 19.7064 },
  { id: "12330", name: "Poznań", lat: 52.4064, lon: 16.9252 },
  { id: "12695", name: "Przemyśl", lat: 49.7839, lon: 22.7678 },
  { id: "12540", name: "Racibórz", lat: 50.0919, lon: 18.2192 },
  { id: "12210", name: "Resko", lat: 53.7667, lon: 15.4167 },
  { id: "12580", name: "Rzeszów", lat: 50.0412, lon: 21.9991 },
  { id: "12585", name: "Sandomierz", lat: 50.6828, lon: 21.7489 },
  { id: "12385", name: "Siedlce", lat: 52.1676, lon: 22.2900 },
  { id: "12310", name: "Słubice", lat: 52.3522, lon: 14.5594 },
  { id: "12469", name: "Sulejów", lat: 51.3550, lon: 19.8714 },
  { id: "12195", name: "Suwałki", lat: 54.1003, lon: 22.9308 },
  { id: "12205", name: "Szczecin", lat: 53.4285, lon: 14.5528 },
  { id: "12215", name: "Szczecinek", lat: 53.7072, lon: 16.6994 },
  { id: "12510", name: "Śnieżka", lat: 50.7361, lon: 15.7397 },
  { id: "12200", name: "Świnoujście", lat: 53.9103, lon: 14.2453 },
  { id: "12575", name: "Tarnów", lat: 50.0121, lon: 20.9858 },
  { id: "12399", name: "Terespol", lat: 52.0747, lon: 23.6156 },
  { id: "12250", name: "Toruń", lat: 53.0138, lon: 18.5981 },
  { id: "12115", name: "Ustka", lat: 54.5803, lon: 16.8614 },
  { id: "12375", name: "Warszawa", lat: 52.2297, lon: 21.0122 },
  { id: "12455", name: "Wieluń", lat: 51.2206, lon: 18.5697 },
  { id: "12497", name: "Włodawa", lat: 51.5508, lon: 23.5475 },
  { id: "12424", name: "Wrocław", lat: 51.1079, lon: 17.0385 },
  { id: "12625", name: "Zakopane", lat: 49.2992, lon: 19.9496 },
  { id: "12595", name: "Zamość", lat: 50.7231, lon: 23.2517 },
  { id: "12400", name: "Zielona Góra", lat: 51.9356, lon: 15.5062 },
];

// City coordinates mapping for location-based station lookup - extensive Polish cities database
const CITY_COORDINATES: Record<string, { lat: number; lon: number }> = {
  // Warmińsko-mazurskie
  "Pasłęk": { lat: 54.0567, lon: 19.6603 },
  "Elbląg": { lat: 54.1522, lon: 19.4088 },
  "Olsztyn": { lat: 53.7784, lon: 20.4801 },
  "Ełk": { lat: 53.8281, lon: 22.3647 },
  "Ostróda": { lat: 53.6961, lon: 19.9658 },
  "Iława": { lat: 53.5964, lon: 19.5686 },
  "Kętrzyn": { lat: 54.0761, lon: 21.3747 },
  "Giżycko": { lat: 54.0381, lon: 21.7656 },
  "Mrągowo": { lat: 53.8647, lon: 21.3028 },
  "Bartoszyce": { lat: 54.2525, lon: 20.8094 },
  "Szczytno": { lat: 53.5622, lon: 20.9856 },
  "Działdowo": { lat: 53.2361, lon: 20.1756 },
  "Braniewo": { lat: 54.3833, lon: 19.8333 },
  "Lidzbark Warmiński": { lat: 54.1256, lon: 20.5792 },
  "Mikołajki": { lat: 53.8017, lon: 21.5708 },
  "Węgorzewo": { lat: 54.2128, lon: 21.7397 },
  "Pisz": { lat: 53.6283, lon: 21.8089 },
  "Nidzica": { lat: 53.3589, lon: 20.4297 },
  "Olecko": { lat: 54.0333, lon: 22.5000 },
  "Morąg": { lat: 53.9167, lon: 19.9333 },
  
  // Pomorskie
  "Gdańsk": { lat: 54.3520, lon: 18.6466 },
  "Gdynia": { lat: 54.5189, lon: 18.5305 },
  "Sopot": { lat: 54.4418, lon: 18.5601 },
  "Słupsk": { lat: 54.4641, lon: 17.0285 },
  "Tczew": { lat: 54.0928, lon: 18.7997 },
  "Starogard Gdański": { lat: 53.9667, lon: 18.5333 },
  "Wejherowo": { lat: 54.6058, lon: 18.2356 },
  "Rumia": { lat: 54.5708, lon: 18.3931 },
  "Chojnice": { lat: 53.6972, lon: 17.5631 },
  "Malbork": { lat: 54.0333, lon: 19.0333 },
  "Kwidzyn": { lat: 53.7333, lon: 18.9333 },
  "Pruszcz Gdański": { lat: 54.2628, lon: 18.6369 },
  "Reda": { lat: 54.6053, lon: 18.3506 },
  "Kartuzy": { lat: 54.3333, lon: 18.2000 },
  "Lębork": { lat: 54.5392, lon: 17.7483 },
  "Bytów": { lat: 54.1667, lon: 17.5000 },
  "Puck": { lat: 54.7167, lon: 18.4167 },
  "Hel": { lat: 54.6083, lon: 18.8012 },
  "Ustka": { lat: 54.5803, lon: 16.8614 },
  "Łeba": { lat: 54.7536, lon: 17.5314 },
  "Władysławowo": { lat: 54.7906, lon: 18.4072 },
  "Jastarnia": { lat: 54.6972, lon: 18.6778 },
  
  // Mazowieckie
  "Warszawa": { lat: 52.2297, lon: 21.0122 },
  "Radom": { lat: 51.4027, lon: 21.1471 },
  "Płock": { lat: 52.5464, lon: 19.7064 },
  "Siedlce": { lat: 52.1676, lon: 22.2900 },
  "Pruszków": { lat: 52.1708, lon: 20.8122 },
  "Legionowo": { lat: 52.4003, lon: 20.9256 },
  "Ostrołęka": { lat: 53.0842, lon: 21.5742 },
  "Piaseczno": { lat: 52.0817, lon: 21.0244 },
  "Otwock": { lat: 52.1056, lon: 21.2619 },
  "Ciechanów": { lat: 52.8792, lon: 20.6197 },
  "Żyrardów": { lat: 52.0489, lon: 20.4464 },
  "Mińsk Mazowiecki": { lat: 52.1789, lon: 21.5606 },
  "Wołomin": { lat: 52.3458, lon: 21.2428 },
  "Sochaczew": { lat: 52.2297, lon: 20.2383 },
  "Mława": { lat: 53.1119, lon: 20.3769 },
  "Grodzisk Mazowiecki": { lat: 52.1072, lon: 20.6253 },
  "Nowy Dwór Mazowiecki": { lat: 52.4333, lon: 20.7167 },
  "Kozienice": { lat: 51.5836, lon: 21.5583 },
  
  // Małopolskie
  "Kraków": { lat: 50.0647, lon: 19.9450 },
  "Tarnów": { lat: 50.0121, lon: 20.9858 },
  "Nowy Sącz": { lat: 49.6250, lon: 20.6903 },
  "Oświęcim": { lat: 50.0344, lon: 19.2097 },
  "Chrzanów": { lat: 50.1356, lon: 19.4025 },
  "Olkusz": { lat: 50.2814, lon: 19.5636 },
  "Nowy Targ": { lat: 49.4772, lon: 20.0325 },
  "Bochnia": { lat: 49.9692, lon: 20.4306 },
  "Gorlice": { lat: 49.6550, lon: 21.1597 },
  "Zakopane": { lat: 49.2992, lon: 19.9496 },
  "Wieliczka": { lat: 49.9872, lon: 20.0644 },
  "Wadowice": { lat: 49.8833, lon: 19.4925 },
  "Krynica-Zdrój": { lat: 49.4233, lon: 20.9589 },
  "Myślenice": { lat: 49.8333, lon: 19.9333 },
  "Limanowa": { lat: 49.7050, lon: 20.4264 },
  
  // Śląskie
  "Katowice": { lat: 50.2649, lon: 19.0238 },
  "Częstochowa": { lat: 50.8118, lon: 19.1203 },
  "Sosnowiec": { lat: 50.2869, lon: 19.1039 },
  "Gliwice": { lat: 50.2945, lon: 18.6714 },
  "Zabrze": { lat: 50.3249, lon: 18.7857 },
  "Bytom": { lat: 50.3484, lon: 18.9156 },
  "Bielsko-Biała": { lat: 49.8225, lon: 19.0444 },
  "Ruda Śląska": { lat: 50.2558, lon: 18.8556 },
  "Rybnik": { lat: 50.1022, lon: 18.5463 },
  "Tychy": { lat: 50.1217, lon: 18.9986 },
  "Dąbrowa Górnicza": { lat: 50.3217, lon: 19.1947 },
  "Chorzów": { lat: 50.2972, lon: 18.9545 },
  "Jaworzno": { lat: 50.2050, lon: 19.2747 },
  "Jastrzębie-Zdrój": { lat: 49.9506, lon: 18.6008 },
  "Mysłowice": { lat: 50.2083, lon: 19.1667 },
  "Siemianowice Śląskie": { lat: 50.3264, lon: 19.0297 },
  "Żory": { lat: 50.0444, lon: 18.7006 },
  "Tarnowskie Góry": { lat: 50.4450, lon: 18.8614 },
  "Racibórz": { lat: 50.0919, lon: 18.2192 },
  "Cieszyn": { lat: 49.7500, lon: 18.6333 },
  "Wisła": { lat: 49.6556, lon: 18.8614 },
  "Ustroń": { lat: 49.7208, lon: 18.8097 },
  "Szczyrk": { lat: 49.7167, lon: 19.0333 },
  
  // Wielkopolskie
  "Poznań": { lat: 52.4064, lon: 16.9252 },
  "Kalisz": { lat: 51.7611, lon: 18.0919 },
  "Konin": { lat: 52.2230, lon: 18.2511 },
  "Piła": { lat: 53.1519, lon: 16.7383 },
  "Ostrów Wielkopolski": { lat: 51.6494, lon: 17.8069 },
  "Gniezno": { lat: 52.5347, lon: 17.5828 },
  "Leszno": { lat: 51.8400, lon: 16.5756 },
  "Swarzędz": { lat: 52.4106, lon: 17.0786 },
  "Luboń": { lat: 52.3478, lon: 16.8750 },
  "Krotoszyn": { lat: 51.6978, lon: 17.4364 },
  "Turek": { lat: 52.0167, lon: 18.5000 },
  "Śrem": { lat: 52.0883, lon: 17.0156 },
  "Jarocin": { lat: 51.9714, lon: 17.5025 },
  "Wągrowiec": { lat: 52.8089, lon: 17.1986 },
  "Koło": { lat: 52.2006, lon: 18.6361 },
  "Rawicz": { lat: 51.6097, lon: 16.8583 },
  "Złotów": { lat: 53.3614, lon: 17.0403 },
  "Środa Wielkopolska": { lat: 52.2278, lon: 17.2753 },
  
  // Dolnośląskie
  "Wrocław": { lat: 51.1079, lon: 17.0385 },
  "Wałbrzych": { lat: 50.7714, lon: 16.2842 },
  "Legnica": { lat: 51.2070, lon: 16.1619 },
  "Jelenia Góra": { lat: 50.9044, lon: 15.7197 },
  "Lubin": { lat: 51.3992, lon: 16.2017 },
  "Głogów": { lat: 51.6636, lon: 16.0847 },
  "Świdnica": { lat: 50.8439, lon: 16.4900 },
  "Bolesławiec": { lat: 51.2633, lon: 15.5697 },
  "Oleśnica": { lat: 51.2097, lon: 17.3944 },
  "Dzierżoniów": { lat: 50.7286, lon: 16.6514 },
  "Zgorzelec": { lat: 51.1517, lon: 15.0083 },
  "Oława": { lat: 50.9456, lon: 17.2922 },
  "Bielawa": { lat: 50.6917, lon: 16.6231 },
  "Kłodzko": { lat: 50.4347, lon: 16.6614 },
  "Ząbkowice Śląskie": { lat: 50.5897, lon: 16.8136 },
  "Strzegom": { lat: 50.9619, lon: 16.3511 },
  "Kamienna Góra": { lat: 50.7819, lon: 16.0314 },
  "Karpacz": { lat: 50.7631, lon: 15.7622 },
  "Szklarska Poręba": { lat: 50.8272, lon: 15.5206 },
  
  // Łódzkie
  "Łódź": { lat: 51.7592, lon: 19.4560 },
  "Piotrków Trybunalski": { lat: 51.4053, lon: 19.7031 },
  "Pabianice": { lat: 51.6644, lon: 19.3547 },
  "Tomaszów Mazowiecki": { lat: 51.5308, lon: 20.0086 },
  "Bełchatów": { lat: 51.3619, lon: 19.3569 },
  "Zgierz": { lat: 51.8556, lon: 19.4069 },
  "Skierniewice": { lat: 51.9547, lon: 20.1586 },
  "Radomsko": { lat: 51.0678, lon: 19.4458 },
  "Kutno": { lat: 52.2319, lon: 19.3644 },
  "Sieradz": { lat: 51.5953, lon: 18.7306 },
  "Wieluń": { lat: 51.2206, lon: 18.5697 },
  "Zduńska Wola": { lat: 51.5983, lon: 18.9375 },
  "Aleksandrów Łódzki": { lat: 51.8186, lon: 19.3028 },
  "Ozorków": { lat: 51.9656, lon: 19.2894 },
  "Łowicz": { lat: 52.1064, lon: 19.9439 },
  "Opoczno": { lat: 51.3761, lon: 20.2789 },
  "Sulejów": { lat: 51.3550, lon: 19.8714 },
  
  // Kujawsko-pomorskie
  "Bydgoszcz": { lat: 53.1235, lon: 18.0084 },
  "Toruń": { lat: 53.0138, lon: 18.5984 },
  "Włocławek": { lat: 52.6483, lon: 19.0678 },
  "Grudziądz": { lat: 53.4839, lon: 18.7536 },
  "Inowrocław": { lat: 52.7972, lon: 18.2608 },
  "Brodnica": { lat: 53.2583, lon: 19.3969 },
  "Świecie": { lat: 53.4133, lon: 18.4322 },
  "Chełmno": { lat: 53.3489, lon: 18.4247 },
  "Nakło nad Notecią": { lat: 53.1417, lon: 17.5942 },
  "Mogilno": { lat: 52.6500, lon: 17.9500 },
  "Ciechocinek": { lat: 52.8783, lon: 18.7953 },
  "Aleksandrów Kujawski": { lat: 52.8744, lon: 18.6944 },
  
  // Lubelskie
  "Lublin": { lat: 51.2465, lon: 22.5684 },
  "Zamość": { lat: 50.7231, lon: 23.2517 },
  "Chełm": { lat: 51.1431, lon: 23.4717 },
  "Biała Podlaska": { lat: 52.0325, lon: 23.1147 },
  "Puławy": { lat: 51.4186, lon: 21.9686 },
  "Świdnik": { lat: 51.2208, lon: 22.6969 },
  "Łuków": { lat: 51.9264, lon: 22.3842 },
  "Kraśnik": { lat: 50.9244, lon: 22.2272 },
  "Lubartów": { lat: 51.4594, lon: 22.6047 },
  "Łęczna": { lat: 51.2983, lon: 22.8811 },
  "Hrubieszów": { lat: 50.8072, lon: 23.8886 },
  "Tomaszów Lubelski": { lat: 50.4478, lon: 23.4158 },
  "Biłgoraj": { lat: 50.5411, lon: 22.7214 },
  "Włodawa": { lat: 51.5508, lon: 23.5475 },
  
  // Podkarpackie
  "Rzeszów": { lat: 50.0413, lon: 21.9990 },
  "Przemyśl": { lat: 49.7839, lon: 22.7678 },
  "Stalowa Wola": { lat: 50.5828, lon: 22.0533 },
  "Mielec": { lat: 50.2872, lon: 21.4256 },
  "Tarnobrzeg": { lat: 50.5728, lon: 21.6789 },
  "Krosno": { lat: 49.6886, lon: 21.7700 },
  "Dębica": { lat: 50.0500, lon: 21.4167 },
  "Jarosław": { lat: 50.0167, lon: 22.6833 },
  "Sanok": { lat: 49.5556, lon: 22.2044 },
  "Jasło": { lat: 49.7453, lon: 21.4714 },
  "Łańcut": { lat: 50.0689, lon: 22.2294 },
  "Lesko": { lat: 49.4700, lon: 22.3289 },
  "Ustrzyki Dolne": { lat: 49.4306, lon: 22.5944 },
  "Sandomierz": { lat: 50.6828, lon: 21.7489 },
  
  // Podlaskie
  "Białystok": { lat: 53.1325, lon: 23.1688 },
  "Suwałki": { lat: 54.1003, lon: 22.9308 },
  "Łomża": { lat: 53.1783, lon: 22.0594 },
  "Augustów": { lat: 53.8433, lon: 22.9797 },
  "Bielsk Podlaski": { lat: 52.7650, lon: 23.1897 },
  "Hajnówka": { lat: 52.7433, lon: 23.5831 },
  "Zambrów": { lat: 52.9856, lon: 22.2431 },
  "Grajewo": { lat: 53.6458, lon: 22.4539 },
  "Siemiatycze": { lat: 52.4272, lon: 22.8625 },
  "Sokółka": { lat: 53.4044, lon: 23.4992 },
  "Mońki": { lat: 53.4061, lon: 22.7992 },
  "Kolno": { lat: 53.4111, lon: 21.9339 },
  
  // Zachodniopomorskie
  "Szczecin": { lat: 53.4285, lon: 14.5528 },
  "Koszalin": { lat: 54.1944, lon: 16.1722 },
  "Stargard": { lat: 53.3361, lon: 15.0500 },
  "Kołobrzeg": { lat: 54.1758, lon: 15.5833 },
  "Świnoujście": { lat: 53.9103, lon: 14.2453 },
  "Szczecinek": { lat: 53.7072, lon: 16.6994 },
  "Police": { lat: 53.5517, lon: 14.5692 },
  "Wałcz": { lat: 53.2736, lon: 16.4681 },
  "Białogard": { lat: 54.0067, lon: 15.9867 },
  "Gryfino": { lat: 53.2536, lon: 14.4883 },
  "Goleniów": { lat: 53.5614, lon: 14.8256 },
  "Nowogard": { lat: 53.6703, lon: 15.1186 },
  "Gryfice": { lat: 53.9153, lon: 15.1986 },
  "Świdwin": { lat: 53.7750, lon: 15.7778 },
  "Międzyzdroje": { lat: 53.9272, lon: 14.4483 },
  "Resko": { lat: 53.7667, lon: 15.4167 },
  "Darłowo": { lat: 54.4244, lon: 16.4122 },
  "Mielno": { lat: 54.2625, lon: 16.0611 },
  
  // Świętokrzyskie
  "Kielce": { lat: 50.8661, lon: 20.6286 },
  "Ostrowiec Świętokrzyski": { lat: 50.9294, lon: 21.3856 },
  "Starachowice": { lat: 51.0378, lon: 21.0697 },
  "Skarżysko-Kamienna": { lat: 51.1136, lon: 20.8617 },
  "Końskie": { lat: 51.1903, lon: 20.4158 },
  "Busko-Zdrój": { lat: 50.4706, lon: 20.7189 },
  "Jędrzejów": { lat: 50.6450, lon: 20.3033 },
  "Staszów": { lat: 50.5617, lon: 21.1656 },
  "Pińczów": { lat: 50.5203, lon: 20.5275 },
  
  // Lubuskie
  "Zielona Góra": { lat: 51.9356, lon: 15.5062 },
  "Gorzów Wielkopolski": { lat: 52.7368, lon: 15.2288 },
  "Nowa Sól": { lat: 51.8042, lon: 15.7142 },
  "Żary": { lat: 51.6383, lon: 15.1353 },
  "Żagań": { lat: 51.6178, lon: 15.3172 },
  "Świebodzin": { lat: 52.2486, lon: 15.5331 },
  "Międzyrzecz": { lat: 52.4442, lon: 15.5783 },
  "Kostrzyn nad Odrą": { lat: 52.5867, lon: 14.6558 },
  "Słubice": { lat: 52.3522, lon: 14.5594 },
  "Gubin": { lat: 51.9511, lon: 14.7178 },
  "Krosno Odrzańskie": { lat: 52.0556, lon: 15.0986 },
  "Sulechów": { lat: 52.0831, lon: 15.6264 },
  
  // Opolskie
  "Opole": { lat: 50.6751, lon: 17.9213 },
  "Kędzierzyn-Koźle": { lat: 50.3500, lon: 18.2167 },
  "Nysa": { lat: 50.4747, lon: 17.3339 },
  "Brzeg": { lat: 50.8600, lon: 17.4686 },
  "Kluczbork": { lat: 50.9728, lon: 18.2158 },
  "Prudnik": { lat: 50.3217, lon: 17.5750 },
  "Strzelce Opolskie": { lat: 50.5122, lon: 18.2986 },
  "Namysłów": { lat: 51.0761, lon: 17.7253 },
  "Krapkowice": { lat: 50.4750, lon: 17.9653 },
  "Głubczyce": { lat: 50.2008, lon: 17.8286 },
  "Zdzieszowice": { lat: 50.4233, lon: 18.1319 },
};

// Calculate distance between two points using Haversine formula
function getDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Earth's radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

// Find nearest station to given coordinates
function findNearestStation(lat: number, lon: number): StationCoords {
  let nearest = STATIONS[0];
  let minDistance = getDistance(lat, lon, nearest.lat, nearest.lon);

  for (const station of STATIONS) {
    const distance = getDistance(lat, lon, station.lat, station.lon);
    if (distance < minDistance) {
      minDistance = distance;
      nearest = station;
    }
  }

  return nearest;
}

// Find station based on city name
function findStationByCity(cityName: string): StationCoords | null {
  // First check if city is in our coordinates map
  const cityCoords = CITY_COORDINATES[cityName];
  if (cityCoords) {
    return findNearestStation(cityCoords.lat, cityCoords.lon);
  }

  // Try to find a station with similar name
  const normalizedCity = cityName.toLowerCase();
  const matchingStation = STATIONS.find(s => 
    s.name.toLowerCase() === normalizedCity ||
    s.name.toLowerCase().includes(normalizedCity) ||
    normalizedCity.includes(s.name.toLowerCase())
  );
  
  return matchingStation || null;
}

interface UseWeatherOptions {
  city?: string | null;
  voivodeship?: string | null;
  manualStationId?: string | null;
  coordinates?: { lat: number; lng: number } | null;
}

export function useWeather(defaultStationId: string = "12375", options?: UseWeatherOptions) {
  const [state, setState] = useState<WeatherState>({
    data: null,
    isLoading: true,
    error: null,
  });
  const [stationId, setStationId] = useState<string>(defaultStationId);
  const [isManualSelection, setIsManualSelection] = useState<boolean>(false);

  // Get station based on manual selection, coordinates, city, or browser geolocation
  useEffect(() => {
    // If manual station is selected, use it
    if (options?.manualStationId) {
      setStationId(options.manualStationId);
      setIsManualSelection(true);
      return;
    }

    setIsManualSelection(false);

    // PRIORITY 1: Use exact coordinates if available (most precise)
    if (options?.coordinates) {
      const nearest = findNearestStation(
        options.coordinates.lat,
        options.coordinates.lng
      );
      console.log(`Weather: Using coordinates (${options.coordinates.lat}, ${options.coordinates.lng}) -> Station: ${nearest.name}`);
      setStationId(nearest.id);
      return;
    }

    // PRIORITY 2: Try to use city from options (user's saved location)
    if (options?.city) {
      const stationByCity = findStationByCity(options.city);
      if (stationByCity) {
        console.log(`Weather: Using city "${options.city}" -> Station: ${stationByCity.name}`);
        setStationId(stationByCity.id);
        return;
      }
    }

    // PRIORITY 3: Fallback to browser geolocation
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const nearest = findNearestStation(
            position.coords.latitude,
            position.coords.longitude
          );
          console.log(`Weather: Using browser geolocation -> Station: ${nearest.name}`);
          setStationId(nearest.id);
        },
        () => {
          // Geolocation denied or failed, use default (Warszawa)
          console.log("Weather: Geolocation denied, using default (Warszawa)");
          setStationId(defaultStationId);
        },
        { timeout: 5000, maximumAge: 600000 } // 10 min cache
      );
    }
  }, [defaultStationId, options?.city, options?.manualStationId, options?.coordinates?.lat, options?.coordinates?.lng]);

  const fetchWeather = async () => {
    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }));
      
      const response = await fetch(
        `https://danepubliczne.imgw.pl/api/data/synop/id/${stationId}`
      );
      
      if (!response.ok) {
        throw new Error("Nie udało się pobrać danych pogodowych");
      }
      
      const data = await response.json();
      setState({ data, isLoading: false, error: null });
    } catch (err) {
      setState({ 
        data: null, 
        isLoading: false, 
        error: err instanceof Error ? err.message : "Błąd pobierania pogody" 
      });
    }
  };

  // Fetch weather data
  useEffect(() => {
    fetchWeather();
    
    // Refresh weather every 30 minutes
    const interval = setInterval(fetchWeather, 30 * 60 * 1000);
    
    return () => clearInterval(interval);
  }, [stationId]);

  const refetch = () => {
    fetchWeather();
  };

  return { ...state, stationId, isManualSelection, refetch };
}

export { STATIONS, findNearestStation };
export type { WeatherData, StationCoords, UseWeatherOptions };
