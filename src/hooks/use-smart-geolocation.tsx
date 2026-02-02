import { useState, useCallback, useRef } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { polandDivisions, getVoivodeships, getPowiats, getGminas } from "@/data/poland-divisions";

export interface Coordinates {
  lat: number;
  lng: number;
}

export interface UserLocation {
  voivodeship: string | null;
  county: string | null; // powiat
  city: string | null;
  coordinates?: Coordinates | null;
  detectedAt?: string;
  method?: "browser" | "ip" | "manual";
}

interface SmartGeolocationState {
  location: UserLocation;
  isDetecting: boolean;
  error: string | null;
  detectionPhase: "idle" | "high_accuracy" | "low_accuracy" | "reverse_geocoding" | "ip_fallback" | "success" | "error";
}

type GeolocationErrorType = "PERMISSION_DENIED" | "POSITION_UNAVAILABLE" | "TIMEOUT" | "NOT_SUPPORTED" | "NOT_SECURE" | "UNKNOWN";

interface DetectionResult {
  success: boolean;
  location?: UserLocation;
  error?: GeolocationErrorType;
  message?: string;
}

interface ReverseGeocodingResult {
  city: string | null;
  county: string | null;
  voivodeship: string | null;
}

// Region name mappings from English to Polish voivodeships
const regionMappings: Record<string, string> = {
  'warmia-masuria': 'warmińsko-mazurskie',
  'warmian-masurian': 'warmińsko-mazurskie',
  'warmia-masurian': 'warmińsko-mazurskie',
  'pomeranian': 'pomorskie',
  'masovian': 'mazowieckie',
  'lesser poland': 'małopolskie',
  'silesian': 'śląskie',
  'greater poland': 'wielkopolskie',
  'lower silesian': 'dolnośląskie',
  'łódź': 'łódzkie',
  'lodz': 'łódzkie',
  'kuyavian-pomeranian': 'kujawsko-pomorskie',
  'subcarpathian': 'podkarpackie',
  'lublin': 'lubelskie',
  'west pomeranian': 'zachodniopomorskie',
  'podlaskie': 'podlaskie',
  'holy cross': 'świętokrzyskie',
  'opole': 'opolskie',
  'lubusz': 'lubuskie',
};

// Polish voivodeship name mappings from Nominatim responses
const voivodeshipMappings: Record<string, string> = {
  'województwo zachodniopomorskie': 'zachodniopomorskie',
  'województwo warmińsko-mazurskie': 'warmińsko-mazurskie',
  'województwo pomorskie': 'pomorskie',
  'województwo mazowieckie': 'mazowieckie',
  'województwo małopolskie': 'małopolskie',
  'województwo śląskie': 'śląskie',
  'województwo dolnośląskie': 'dolnośląskie',
  'województwo wielkopolskie': 'wielkopolskie',
  'województwo łódzkie': 'łódzkie',
  'województwo kujawsko-pomorskie': 'kujawsko-pomorskie',
  'województwo lubelskie': 'lubelskie',
  'województwo podkarpackie': 'podkarpackie',
  'województwo podlaskie': 'podlaskie',
  'województwo świętokrzyskie': 'świętokrzyskie',
  'województwo opolskie': 'opolskie',
  'województwo lubuskie': 'lubuskie',
  'zachodniopomorskie': 'zachodniopomorskie',
  'warmińsko-mazurskie': 'warmińsko-mazurskie',
  'pomorskie': 'pomorskie',
  'mazowieckie': 'mazowieckie',
  'małopolskie': 'małopolskie',
  'śląskie': 'śląskie',
  'dolnośląskie': 'dolnośląskie',
  'wielkopolskie': 'wielkopolskie',
  'łódzkie': 'łódzkie',
  'kujawsko-pomorskie': 'kujawsko-pomorskie',
  'lubelskie': 'lubelskie',
  'podkarpackie': 'podkarpackie',
  'podlaskie': 'podlaskie',
  'świętokrzyskie': 'świętokrzyskie',
  'opolskie': 'opolskie',
  'lubuskie': 'lubuskie',
};

// Map coordinates to nearest major cities - FALLBACK ONLY (used when reverse geocoding fails)
const cityCoordinates: Array<{ name: string; voivodeship: string; powiat: string; lat: number; lng: number }> = [
  // ============ ZACHODNIOPOMORSKIE ============
  { name: "Szczecin", voivodeship: "zachodniopomorskie", powiat: "m. Szczecin", lat: 53.4285, lng: 14.5528 },
  { name: "Koszalin", voivodeship: "zachodniopomorskie", powiat: "m. Koszalin", lat: 54.1943, lng: 16.1722 },
  { name: "Kołobrzeg", voivodeship: "zachodniopomorskie", powiat: "kołobrzeski", lat: 54.1758, lng: 15.5839 },
  { name: "Świnoujście", voivodeship: "zachodniopomorskie", powiat: "m. Świnoujście", lat: 53.9100, lng: 14.2472 },
  { name: "Stargard", voivodeship: "zachodniopomorskie", powiat: "stargardzki", lat: 53.3367, lng: 15.0494 },
  { name: "Police", voivodeship: "zachodniopomorskie", powiat: "policki", lat: 53.5517, lng: 14.5694 },
  { name: "Sławno", voivodeship: "zachodniopomorskie", powiat: "sławieński", lat: 54.3633, lng: 16.6867 },
  { name: "Białogard", voivodeship: "zachodniopomorskie", powiat: "białogardzki", lat: 54.0039, lng: 15.9883 },
  { name: "Szczecinek", voivodeship: "zachodniopomorskie", powiat: "szczecinecki", lat: 53.7081, lng: 16.6992 },
  { name: "Wałcz", voivodeship: "zachodniopomorskie", powiat: "wałecki", lat: 53.2717, lng: 16.4678 },
  { name: "Drawsko Pomorskie", voivodeship: "zachodniopomorskie", powiat: "drawski", lat: 53.5306, lng: 15.8086 },
  { name: "Gryfice", voivodeship: "zachodniopomorskie", powiat: "gryficki", lat: 53.9147, lng: 15.1978 },
  { name: "Gryfino", voivodeship: "zachodniopomorskie", powiat: "gryfiński", lat: 53.2517, lng: 14.4881 },
  { name: "Kamień Pomorski", voivodeship: "zachodniopomorskie", powiat: "kamieński", lat: 53.9706, lng: 14.7733 },
  { name: "Goleniów", voivodeship: "zachodniopomorskie", powiat: "goleniowski", lat: 53.5631, lng: 14.8297 },
  { name: "Myślibórz", voivodeship: "zachodniopomorskie", powiat: "myśliborski", lat: 52.9233, lng: 14.8639 },
  { name: "Łobez", voivodeship: "zachodniopomorskie", powiat: "łobeski", lat: 53.6383, lng: 15.6169 },
  { name: "Pyrzyce", voivodeship: "zachodniopomorskie", powiat: "pyrzycki", lat: 53.1469, lng: 14.8925 },
  { name: "Choszczno", voivodeship: "zachodniopomorskie", powiat: "choszczeński", lat: 53.1672, lng: 15.4178 },
  
  // ============ WARMIŃSKO-MAZURSKIE ============
  { name: "Olsztyn", voivodeship: "warmińsko-mazurskie", powiat: "m. Olsztyn", lat: 53.7784, lng: 20.4801 },
  { name: "Elbląg", voivodeship: "warmińsko-mazurskie", powiat: "m. Elbląg", lat: 54.1522, lng: 19.4088 },
  { name: "Pasłęk", voivodeship: "warmińsko-mazurskie", powiat: "elbląski", lat: 54.0567, lng: 19.6603 },
  { name: "Ełk", voivodeship: "warmińsko-mazurskie", powiat: "ełcki", lat: 53.8283, lng: 22.3647 },
  { name: "Ostróda", voivodeship: "warmińsko-mazurskie", powiat: "ostródzki", lat: 53.6958, lng: 19.9658 },
  { name: "Iława", voivodeship: "warmińsko-mazurskie", powiat: "iławski", lat: 53.5963, lng: 19.5686 },
  { name: "Giżycko", voivodeship: "warmińsko-mazurskie", powiat: "giżycki", lat: 54.0382, lng: 21.7662 },
  { name: "Kętrzyn", voivodeship: "warmińsko-mazurskie", powiat: "kętrzyński", lat: 54.0757, lng: 21.3758 },
  { name: "Mrągowo", voivodeship: "warmińsko-mazurskie", powiat: "mrągowski", lat: 53.8661, lng: 21.3056 },
  { name: "Lidzbark Warmiński", voivodeship: "warmińsko-mazurskie", powiat: "lidzbarski", lat: 54.1258, lng: 20.5808 },
  { name: "Braniewo", voivodeship: "warmińsko-mazurskie", powiat: "braniewski", lat: 54.3799, lng: 19.8226 },
  { name: "Bartoszyce", voivodeship: "warmińsko-mazurskie", powiat: "bartoszycki", lat: 54.2532, lng: 20.8108 },
  { name: "Szczytno", voivodeship: "warmińsko-mazurskie", powiat: "szczycieński", lat: 53.5622, lng: 20.9863 },
  { name: "Działdowo", voivodeship: "warmińsko-mazurskie", powiat: "działdowski", lat: 53.2378, lng: 20.1806 },
  { name: "Nidzica", voivodeship: "warmińsko-mazurskie", powiat: "nidzicki", lat: 53.3583, lng: 20.4286 },
  { name: "Pisz", voivodeship: "warmińsko-mazurskie", powiat: "piski", lat: 53.6283, lng: 21.8103 },
  { name: "Olecko", voivodeship: "warmińsko-mazurskie", powiat: "olecki", lat: 54.0333, lng: 22.5067 },
  { name: "Węgorzewo", voivodeship: "warmińsko-mazurskie", powiat: "węgorzewski", lat: 54.2128, lng: 21.7489 },
  { name: "Gołdap", voivodeship: "warmińsko-mazurskie", powiat: "gołdapski", lat: 54.3072, lng: 22.3036 },
  { name: "Nowe Miasto Lubawskie", voivodeship: "warmińsko-mazurskie", powiat: "nowomiejski", lat: 53.4186, lng: 19.5942 },
  
  // ============ POMORSKIE ============
  { name: "Gdańsk", voivodeship: "pomorskie", powiat: "m. Gdańsk", lat: 54.3520, lng: 18.6466 },
  { name: "Gdynia", voivodeship: "pomorskie", powiat: "m. Gdynia", lat: 54.5189, lng: 18.5305 },
  { name: "Sopot", voivodeship: "pomorskie", powiat: "m. Sopot", lat: 54.4418, lng: 18.5601 },
  { name: "Słupsk", voivodeship: "pomorskie", powiat: "m. Słupsk", lat: 54.4641, lng: 17.0285 },
  { name: "Tczew", voivodeship: "pomorskie", powiat: "tczewski", lat: 54.0917, lng: 18.7969 },
  { name: "Starogard Gdański", voivodeship: "pomorskie", powiat: "starogardzki", lat: 53.9653, lng: 18.5306 },
  { name: "Wejherowo", voivodeship: "pomorskie", powiat: "wejherowski", lat: 54.6060, lng: 18.2358 },
  { name: "Rumia", voivodeship: "pomorskie", powiat: "wejherowski", lat: 54.5708, lng: 18.3939 },
  { name: "Malbork", voivodeship: "pomorskie", powiat: "malborski", lat: 54.0357, lng: 19.0282 },
  { name: "Pruszcz Gdański", voivodeship: "pomorskie", powiat: "gdański", lat: 54.2622, lng: 18.6347 },
  { name: "Chojnice", voivodeship: "pomorskie", powiat: "chojnicki", lat: 53.6961, lng: 17.5558 },
  { name: "Kościerzyna", voivodeship: "pomorskie", powiat: "kościerski", lat: 54.1217, lng: 17.9811 },
  { name: "Kartuzy", voivodeship: "pomorskie", powiat: "kartuski", lat: 54.3333, lng: 18.2000 },
  { name: "Bytów", voivodeship: "pomorskie", powiat: "bytowski", lat: 54.1697, lng: 17.4917 },
  { name: "Lębork", voivodeship: "pomorskie", powiat: "lęborski", lat: 54.5389, lng: 17.7528 },
  { name: "Puck", voivodeship: "pomorskie", powiat: "pucki", lat: 54.7200, lng: 18.4108 },
  { name: "Człuchów", voivodeship: "pomorskie", powiat: "człuchowski", lat: 53.6658, lng: 17.3544 },
  { name: "Kwidzyn", voivodeship: "pomorskie", powiat: "kwidzyński", lat: 53.7342, lng: 18.9311 },
  { name: "Sztum", voivodeship: "pomorskie", powiat: "sztumski", lat: 53.9244, lng: 19.0306 },
  { name: "Nowy Dwór Gdański", voivodeship: "pomorskie", powiat: "nowodworski", lat: 54.2147, lng: 19.1172 },
  
  // ============ MAZOWIECKIE ============
  { name: "Warszawa", voivodeship: "mazowieckie", powiat: "m. st. Warszawa", lat: 52.2297, lng: 21.0122 },
  { name: "Radom", voivodeship: "mazowieckie", powiat: "m. Radom", lat: 51.4027, lng: 21.1471 },
  { name: "Płock", voivodeship: "mazowieckie", powiat: "m. Płock", lat: 52.5461, lng: 19.7064 },
  { name: "Siedlce", voivodeship: "mazowieckie", powiat: "m. Siedlce", lat: 52.1676, lng: 22.2900 },
  { name: "Pruszków", voivodeship: "mazowieckie", powiat: "pruszkowski", lat: 52.1708, lng: 20.8122 },
  { name: "Legionowo", voivodeship: "mazowieckie", powiat: "legionowski", lat: 52.4044, lng: 20.9258 },
  { name: "Ostrołęka", voivodeship: "mazowieckie", powiat: "m. Ostrołęka", lat: 53.0844, lng: 21.5739 },
  { name: "Piaseczno", voivodeship: "mazowieckie", powiat: "piaseczyński", lat: 52.0731, lng: 21.0239 },
  { name: "Otwock", voivodeship: "mazowieckie", powiat: "otwocki", lat: 52.1053, lng: 21.2614 },
  { name: "Ciechanów", voivodeship: "mazowieckie", powiat: "ciechanowski", lat: 52.8797, lng: 20.6183 },
  { name: "Mława", voivodeship: "mazowieckie", powiat: "mławski", lat: 53.1119, lng: 20.3836 },
  { name: "Żyrardów", voivodeship: "mazowieckie", powiat: "żyrardowski", lat: 52.0492, lng: 20.4469 },
  
  // ============ MAŁOPOLSKIE ============
  { name: "Kraków", voivodeship: "małopolskie", powiat: "m. Kraków", lat: 50.0647, lng: 19.9450 },
  { name: "Tarnów", voivodeship: "małopolskie", powiat: "m. Tarnów", lat: 50.0121, lng: 20.9858 },
  { name: "Nowy Sącz", voivodeship: "małopolskie", powiat: "m. Nowy Sącz", lat: 49.6247, lng: 20.7153 },
  { name: "Oświęcim", voivodeship: "małopolskie", powiat: "oświęcimski", lat: 50.0343, lng: 19.2444 },
  { name: "Chrzanów", voivodeship: "małopolskie", powiat: "chrzanowski", lat: 50.1356, lng: 19.4025 },
  { name: "Olkusz", voivodeship: "małopolskie", powiat: "olkuski", lat: 50.2814, lng: 19.5658 },
  { name: "Zakopane", voivodeship: "małopolskie", powiat: "tatrzański", lat: 49.2992, lng: 19.9497 },
  { name: "Nowy Targ", voivodeship: "małopolskie", powiat: "nowotarski", lat: 49.4772, lng: 20.0325 },
  { name: "Bochnia", voivodeship: "małopolskie", powiat: "bocheński", lat: 49.9692, lng: 20.4319 },
  { name: "Wieliczka", voivodeship: "małopolskie", powiat: "wielicki", lat: 49.9872, lng: 20.0647 },
  { name: "Gorlice", voivodeship: "małopolskie", powiat: "gorlicki", lat: 49.6542, lng: 21.1600 },
  
  // ============ ŚLĄSKIE ============
  { name: "Katowice", voivodeship: "śląskie", powiat: "m. Katowice", lat: 50.2649, lng: 19.0238 },
  { name: "Częstochowa", voivodeship: "śląskie", powiat: "m. Częstochowa", lat: 50.8118, lng: 19.1203 },
  { name: "Sosnowiec", voivodeship: "śląskie", powiat: "m. Sosnowiec", lat: 50.2864, lng: 19.1042 },
  { name: "Gliwice", voivodeship: "śląskie", powiat: "m. Gliwice", lat: 50.2945, lng: 18.6714 },
  { name: "Zabrze", voivodeship: "śląskie", powiat: "m. Zabrze", lat: 50.3249, lng: 18.7857 },
  { name: "Bytom", voivodeship: "śląskie", powiat: "m. Bytom", lat: 50.3483, lng: 18.9156 },
  { name: "Bielsko-Biała", voivodeship: "śląskie", powiat: "m. Bielsko-Biała", lat: 49.8225, lng: 19.0586 },
  { name: "Ruda Śląska", voivodeship: "śląskie", powiat: "m. Ruda Śląska", lat: 50.2558, lng: 18.8556 },
  { name: "Rybnik", voivodeship: "śląskie", powiat: "m. Rybnik", lat: 50.1022, lng: 18.5417 },
  { name: "Tychy", voivodeship: "śląskie", powiat: "m. Tychy", lat: 50.1306, lng: 18.9867 },
  { name: "Dąbrowa Górnicza", voivodeship: "śląskie", powiat: "m. Dąbrowa Górnicza", lat: 50.3217, lng: 19.1947 },
  { name: "Chorzów", voivodeship: "śląskie", powiat: "m. Chorzów", lat: 50.2972, lng: 18.9544 },
  { name: "Jastrzębie-Zdrój", voivodeship: "śląskie", powiat: "m. Jastrzębie-Zdrój", lat: 49.9506, lng: 18.5972 },
  { name: "Jaworzno", voivodeship: "śląskie", powiat: "m. Jaworzno", lat: 50.2036, lng: 19.2750 },
  { name: "Mysłowice", voivodeship: "śląskie", powiat: "m. Mysłowice", lat: 50.2081, lng: 19.1661 },
  { name: "Żory", voivodeship: "śląskie", powiat: "m. Żory", lat: 50.0456, lng: 18.7017 },
  { name: "Cieszyn", voivodeship: "śląskie", powiat: "cieszyński", lat: 49.7500, lng: 18.6333 },
  { name: "Żywiec", voivodeship: "śląskie", powiat: "żywiecki", lat: 49.6886, lng: 19.1919 },
  
  // ============ DOLNOŚLĄSKIE ============
  { name: "Wrocław", voivodeship: "dolnośląskie", powiat: "m. Wrocław", lat: 51.1079, lng: 17.0385 },
  { name: "Wałbrzych", voivodeship: "dolnośląskie", powiat: "m. Wałbrzych", lat: 50.7714, lng: 16.2844 },
  { name: "Legnica", voivodeship: "dolnośląskie", powiat: "m. Legnica", lat: 51.2070, lng: 16.1619 },
  { name: "Jelenia Góra", voivodeship: "dolnośląskie", powiat: "m. Jelenia Góra", lat: 50.9044, lng: 15.7194 },
  { name: "Lubin", voivodeship: "dolnośląskie", powiat: "lubiński", lat: 51.4000, lng: 16.2017 },
  { name: "Głogów", voivodeship: "dolnośląskie", powiat: "głogowski", lat: 51.6633, lng: 16.0847 },
  { name: "Świdnica", voivodeship: "dolnośląskie", powiat: "świdnicki", lat: 50.8428, lng: 16.4900 },
  { name: "Bolesławiec", voivodeship: "dolnośląskie", powiat: "bolesławiecki", lat: 51.2647, lng: 15.5694 },
  { name: "Oleśnica", voivodeship: "dolnośląskie", powiat: "oleśnicki", lat: 51.2094, lng: 17.3817 },
  { name: "Kłodzko", voivodeship: "dolnośląskie", powiat: "kłodzki", lat: 50.4342, lng: 16.6611 },
  { name: "Dzierżoniów", voivodeship: "dolnośląskie", powiat: "dzierżoniowski", lat: 50.7272, lng: 16.6522 },
  
  // ============ WIELKOPOLSKIE ============
  { name: "Poznań", voivodeship: "wielkopolskie", powiat: "m. Poznań", lat: 52.4064, lng: 16.9252 },
  { name: "Kalisz", voivodeship: "wielkopolskie", powiat: "m. Kalisz", lat: 51.7611, lng: 18.0911 },
  { name: "Konin", voivodeship: "wielkopolskie", powiat: "m. Konin", lat: 52.2231, lng: 18.2508 },
  { name: "Piła", voivodeship: "wielkopolskie", powiat: "pilski", lat: 53.1519, lng: 16.7381 },
  { name: "Ostrów Wielkopolski", voivodeship: "wielkopolskie", powiat: "ostrowski", lat: 51.6489, lng: 17.8069 },
  { name: "Gniezno", voivodeship: "wielkopolskie", powiat: "gnieźnieński", lat: 52.5342, lng: 17.5828 },
  { name: "Leszno", voivodeship: "wielkopolskie", powiat: "m. Leszno", lat: 51.8400, lng: 16.5747 },
  { name: "Jarocin", voivodeship: "wielkopolskie", powiat: "jarociński", lat: 51.9719, lng: 17.4986 },
  { name: "Śrem", voivodeship: "wielkopolskie", powiat: "śremski", lat: 52.0869, lng: 17.0147 },
  { name: "Swarzędz", voivodeship: "wielkopolskie", powiat: "poznański", lat: 52.4125, lng: 17.0842 },
  { name: "Luboń", voivodeship: "wielkopolskie", powiat: "poznański", lat: 52.3481, lng: 16.8881 },
  { name: "Turek", voivodeship: "wielkopolskie", powiat: "turecki", lat: 52.0164, lng: 18.5000 },
  { name: "Rawicz", voivodeship: "wielkopolskie", powiat: "rawicki", lat: 51.6092, lng: 16.8583 },
  { name: "Krotoszyn", voivodeship: "wielkopolskie", powiat: "krotoszyński", lat: 51.6981, lng: 17.4369 },
  
  // ============ ŁÓDZKIE ============
  { name: "Łódź", voivodeship: "łódzkie", powiat: "m. Łódź", lat: 51.7592, lng: 19.4560 },
  { name: "Piotrków Trybunalski", voivodeship: "łódzkie", powiat: "m. Piotrków Trybunalski", lat: 51.4064, lng: 19.7031 },
  { name: "Pabianice", voivodeship: "łódzkie", powiat: "pabianicki", lat: 51.6647, lng: 19.3547 },
  { name: "Tomaszów Mazowiecki", voivodeship: "łódzkie", powiat: "tomaszowski", lat: 51.5308, lng: 20.0083 },
  { name: "Bełchatów", voivodeship: "łódzkie", powiat: "bełchatowski", lat: 51.3694, lng: 19.3597 },
  { name: "Zgierz", voivodeship: "łódzkie", powiat: "zgierski", lat: 51.8550, lng: 19.4044 },
  { name: "Skierniewice", voivodeship: "łódzkie", powiat: "m. Skierniewice", lat: 51.9547, lng: 20.1583 },
  { name: "Kutno", voivodeship: "łódzkie", powiat: "kutnowski", lat: 52.2311, lng: 19.3614 },
  { name: "Radomsko", voivodeship: "łódzkie", powiat: "radomszczański", lat: 51.0678, lng: 19.4450 },
  { name: "Sieradz", voivodeship: "łódzkie", powiat: "sieradzki", lat: 51.5950, lng: 18.7306 },
  { name: "Zduńska Wola", voivodeship: "łódzkie", powiat: "zduńskowolski", lat: 51.5983, lng: 18.9361 },
  { name: "Łask", voivodeship: "łódzkie", powiat: "łaski", lat: 51.5914, lng: 19.1369 },
  
  // ============ KUJAWSKO-POMORSKIE ============
  { name: "Bydgoszcz", voivodeship: "kujawsko-pomorskie", powiat: "m. Bydgoszcz", lat: 53.1235, lng: 18.0084 },
  { name: "Toruń", voivodeship: "kujawsko-pomorskie", powiat: "m. Toruń", lat: 53.0138, lng: 18.5984 },
  { name: "Włocławek", voivodeship: "kujawsko-pomorskie", powiat: "m. Włocławek", lat: 52.6483, lng: 19.0678 },
  { name: "Grudziądz", voivodeship: "kujawsko-pomorskie", powiat: "m. Grudziądz", lat: 53.4836, lng: 18.7536 },
  { name: "Inowrocław", voivodeship: "kujawsko-pomorskie", powiat: "inowrocławski", lat: 52.7931, lng: 18.2611 },
  { name: "Brodnica", voivodeship: "kujawsko-pomorskie", powiat: "brodnicki", lat: 53.2597, lng: 19.3972 },
  { name: "Świecie", voivodeship: "kujawsko-pomorskie", powiat: "świecki", lat: 53.4108, lng: 18.4389 },
  { name: "Chełmno", voivodeship: "kujawsko-pomorskie", powiat: "chełmiński", lat: 53.3489, lng: 18.4286 },
  { name: "Nakło nad Notecią", voivodeship: "kujawsko-pomorskie", powiat: "nakielski", lat: 53.1417, lng: 17.5931 },
  { name: "Mogilno", voivodeship: "kujawsko-pomorskie", powiat: "mogileński", lat: 52.6511, lng: 17.9514 },
  
  // ============ LUBELSKIE ============
  { name: "Lublin", voivodeship: "lubelskie", powiat: "m. Lublin", lat: 51.2465, lng: 22.5684 },
  { name: "Chełm", voivodeship: "lubelskie", powiat: "m. Chełm", lat: 51.1328, lng: 23.4714 },
  { name: "Zamość", voivodeship: "lubelskie", powiat: "m. Zamość", lat: 50.7231, lng: 23.2522 },
  { name: "Biała Podlaska", voivodeship: "lubelskie", powiat: "m. Biała Podlaska", lat: 52.0325, lng: 23.1164 },
  { name: "Puławy", voivodeship: "lubelskie", powiat: "puławski", lat: 51.4167, lng: 21.9692 },
  { name: "Świdnik", voivodeship: "lubelskie", powiat: "świdnicki", lat: 51.2222, lng: 22.6967 },
  { name: "Kraśnik", voivodeship: "lubelskie", powiat: "kraśnicki", lat: 50.9242, lng: 22.2283 },
  { name: "Łuków", voivodeship: "lubelskie", powiat: "łukowski", lat: 51.9272, lng: 22.3806 },
  { name: "Tomaszów Lubelski", voivodeship: "lubelskie", powiat: "tomaszowski", lat: 50.4489, lng: 23.4217 },
  { name: "Hrubieszów", voivodeship: "lubelskie", powiat: "hrubieszowski", lat: 50.8053, lng: 23.8894 },
  
  // ============ PODKARPACKIE ============
  { name: "Rzeszów", voivodeship: "podkarpackie", powiat: "m. Rzeszów", lat: 50.0413, lng: 21.9990 },
  { name: "Przemyśl", voivodeship: "podkarpackie", powiat: "m. Przemyśl", lat: 49.7839, lng: 22.7678 },
  { name: "Stalowa Wola", voivodeship: "podkarpackie", powiat: "stalowowolski", lat: 50.5831, lng: 22.0536 },
  { name: "Mielec", voivodeship: "podkarpackie", powiat: "mielecki", lat: 50.2867, lng: 21.4256 },
  { name: "Tarnobrzeg", voivodeship: "podkarpackie", powiat: "m. Tarnobrzeg", lat: 50.5730, lng: 21.6794 },
  { name: "Krosno", voivodeship: "podkarpackie", powiat: "m. Krosno", lat: 49.6889, lng: 21.7706 },
  { name: "Jasło", voivodeship: "podkarpackie", powiat: "jasielski", lat: 49.7444, lng: 21.4744 },
  { name: "Sanok", voivodeship: "podkarpackie", powiat: "sanocki", lat: 49.5625, lng: 22.2094 },
  { name: "Jarosław", voivodeship: "podkarpackie", powiat: "jarosławski", lat: 50.0167, lng: 22.6800 },
  { name: "Dębica", voivodeship: "podkarpackie", powiat: "dębicki", lat: 50.0500, lng: 21.4167 },
  { name: "Przeworsk", voivodeship: "podkarpackie", powiat: "przeworski", lat: 50.0589, lng: 22.4939 },
  
  // ============ PODLASKIE ============
  { name: "Białystok", voivodeship: "podlaskie", powiat: "m. Białystok", lat: 53.1325, lng: 23.1688 },
  { name: "Suwałki", voivodeship: "podlaskie", powiat: "m. Suwałki", lat: 54.1111, lng: 22.9308 },
  { name: "Łomża", voivodeship: "podlaskie", powiat: "m. Łomża", lat: 53.1781, lng: 22.0594 },
  { name: "Augustów", voivodeship: "podlaskie", powiat: "augustowski", lat: 53.8433, lng: 22.9797 },
  { name: "Bielsk Podlaski", voivodeship: "podlaskie", powiat: "bielski", lat: 52.7658, lng: 23.1897 },
  { name: "Grajewo", voivodeship: "podlaskie", powiat: "grajewski", lat: 53.6464, lng: 22.4553 },
  { name: "Zambrów", voivodeship: "podlaskie", powiat: "zambrowski", lat: 52.9856, lng: 22.2456 },
  { name: "Hajnówka", voivodeship: "podlaskie", powiat: "hajnowski", lat: 52.7439, lng: 23.5844 },
  { name: "Sokółka", voivodeship: "podlaskie", powiat: "sokólski", lat: 53.4039, lng: 23.5050 },
  { name: "Sejny", voivodeship: "podlaskie", powiat: "sejneński", lat: 54.1111, lng: 23.3544 },
  
  // ============ ŚWIĘTOKRZYSKIE ============
  { name: "Kielce", voivodeship: "świętokrzyskie", powiat: "m. Kielce", lat: 50.8661, lng: 20.6286 },
  { name: "Ostrowiec Świętokrzyski", voivodeship: "świętokrzyskie", powiat: "ostrowiecki", lat: 50.9294, lng: 21.3853 },
  { name: "Starachowice", voivodeship: "świętokrzyskie", powiat: "starachowicki", lat: 51.0394, lng: 21.0722 },
  { name: "Skarżysko-Kamienna", voivodeship: "świętokrzyskie", powiat: "skarżyski", lat: 51.1133, lng: 20.8608 },
  { name: "Sandomierz", voivodeship: "świętokrzyskie", powiat: "sandomierski", lat: 50.6822, lng: 21.7489 },
  { name: "Końskie", voivodeship: "świętokrzyskie", powiat: "konecki", lat: 51.1928, lng: 20.4147 },
  { name: "Busko-Zdrój", voivodeship: "świętokrzyskie", powiat: "buski", lat: 50.4700, lng: 20.7189 },
  { name: "Jędrzejów", voivodeship: "świętokrzyskie", powiat: "jędrzejowski", lat: 50.6367, lng: 20.3053 },
  { name: "Pińczów", voivodeship: "świętokrzyskie", powiat: "pińczowski", lat: 50.5200, lng: 20.5289 },
  { name: "Staszów", voivodeship: "świętokrzyskie", powiat: "staszowski", lat: 50.5636, lng: 21.1636 },
  
  // ============ OPOLSKIE ============
  { name: "Opole", voivodeship: "opolskie", powiat: "m. Opole", lat: 50.6751, lng: 17.9213 },
  { name: "Kędzierzyn-Koźle", voivodeship: "opolskie", powiat: "kędzierzyńsko-kozielski", lat: 50.3494, lng: 18.2156 },
  { name: "Nysa", voivodeship: "opolskie", powiat: "nyski", lat: 50.4742, lng: 17.3344 },
  { name: "Brzeg", voivodeship: "opolskie", powiat: "brzeski", lat: 50.8619, lng: 17.4678 },
  { name: "Kluczbork", voivodeship: "opolskie", powiat: "kluczborski", lat: 50.9728, lng: 18.2172 },
  { name: "Prudnik", voivodeship: "opolskie", powiat: "prudnicki", lat: 50.3206, lng: 17.5756 },
  { name: "Strzelce Opolskie", voivodeship: "opolskie", powiat: "strzelecki", lat: 50.5117, lng: 18.3006 },
  { name: "Głubczyce", voivodeship: "opolskie", powiat: "głubczycki", lat: 50.2014, lng: 17.8317 },
  { name: "Namysłów", voivodeship: "opolskie", powiat: "namysłowski", lat: 51.0761, lng: 17.7175 },
  { name: "Olesno", voivodeship: "opolskie", powiat: "oleski", lat: 50.8750, lng: 18.4203 },
  
  // ============ LUBUSKIE ============
  { name: "Gorzów Wielkopolski", voivodeship: "lubuskie", powiat: "m. Gorzów Wielkopolski", lat: 52.7368, lng: 15.2288 },
  { name: "Zielona Góra", voivodeship: "lubuskie", powiat: "m. Zielona Góra", lat: 51.9356, lng: 15.5062 },
  { name: "Nowa Sól", voivodeship: "lubuskie", powiat: "nowosolski", lat: 51.8022, lng: 15.7211 },
  { name: "Żary", voivodeship: "lubuskie", powiat: "żarski", lat: 51.6419, lng: 15.1336 },
  { name: "Żagań", voivodeship: "lubuskie", powiat: "żagański", lat: 51.6194, lng: 15.3172 },
  { name: "Świebodzin", voivodeship: "lubuskie", powiat: "świebodziński", lat: 52.2472, lng: 15.5322 },
  { name: "Międzyrzecz", voivodeship: "lubuskie", powiat: "międzyrzecki", lat: 52.4447, lng: 15.5794 },
  { name: "Słubice", voivodeship: "lubuskie", powiat: "słubicki", lat: 52.3500, lng: 14.5600 },
  { name: "Krosno Odrzańskie", voivodeship: "lubuskie", powiat: "krośnieński", lat: 52.0547, lng: 15.0978 },
  { name: "Sulęcin", voivodeship: "lubuskie", powiat: "sulęciński", lat: 52.4478, lng: 15.1183 },
  { name: "Strzelce Krajeńskie", voivodeship: "lubuskie", powiat: "strzelecko-drezdenecki", lat: 52.8786, lng: 15.5319 },
  { name: "Wschowa", voivodeship: "lubuskie", powiat: "wschowski", lat: 51.8078, lng: 16.3139 },
];

const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
};

const findNearestCity = (lat: number, lng: number) => {
  let nearest = cityCoordinates[0];
  let minDistance = calculateDistance(lat, lng, nearest.lat, nearest.lng);

  for (const city of cityCoordinates) {
    const distance = calculateDistance(lat, lng, city.lat, city.lng);
    if (distance < minDistance) {
      minDistance = distance;
      nearest = city;
    }
  }

  return { ...nearest, distance: minDistance };
};

const findCityInDivisions = (cityName: string): { voivodeship: string; powiat: string; city: string } | null => {
  const normalizedCityName = cityName.toLowerCase().trim();
  
  for (const [voivodeship, powiats] of Object.entries(polandDivisions)) {
    for (const [powiat, cities] of Object.entries(powiats)) {
      for (const city of cities) {
        if (city.toLowerCase() === normalizedCityName || 
            normalizedCityName.includes(city.toLowerCase()) ||
            city.toLowerCase().includes(normalizedCityName)) {
          return { voivodeship, powiat, city };
        }
      }
    }
  }
  
  return null;
};

const findVoivodeship = (region: string): string | null => {
  const normalizedRegion = region.toLowerCase().trim();
  
  for (const [key, value] of Object.entries(regionMappings)) {
    if (normalizedRegion.includes(key) || key.includes(normalizedRegion)) {
      return value;
    }
  }
  
  const voivodeships = getVoivodeships();
  for (const v of voivodeships) {
    if (normalizedRegion.includes(v) || v.includes(normalizedRegion)) {
      return v;
    }
  }
  
  return null;
};

const getErrorMessage = (errorType: GeolocationErrorType): string => {
  switch (errorType) {
    case "PERMISSION_DENIED":
      return "Dostęp do lokalizacji został zablokowany. Odblokuj w ustawieniach przeglądarki (ikona kłódki obok adresu).";
    case "POSITION_UNAVAILABLE":
      return "Lokalizacja jest niedostępna. Sprawdź czy GPS jest włączony.";
    case "TIMEOUT":
      return "Przekroczono czas oczekiwania na lokalizację.";
    case "NOT_SUPPORTED":
      return "Twoja przeglądarka nie obsługuje geolokalizacji.";
    case "NOT_SECURE":
      return "Geolokalizacja wymaga bezpiecznego połączenia (HTTPS).";
    default:
      return "Wystąpił nieznany błąd podczas pobierania lokalizacji.";
  }
};

// Reverse Geocoding using OpenStreetMap Nominatim API
const reverseGeocode = async (lat: number, lng: number): Promise<ReverseGeocodingResult | null> => {
  try {
    console.log(`Nominatim: Requesting reverse geocode for (${lat.toFixed(6)}, ${lng.toFixed(6)})`);
    
    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1&accept-language=pl`,
      {
        headers: {
          'User-Agent': 'CorePoint News App (contact@corepoint.pl)'
        }
      }
    );
    
    if (!response.ok) {
      console.error("Nominatim API error:", response.status);
      return null;
    }
    
    const data = await response.json();
    console.log("Nominatim: Raw response:", JSON.stringify(data.address, null, 2));
    
    if (!data.address) {
      console.warn("Nominatim: No address in response");
      return null;
    }
    
    const address = data.address;
    
    // Extract city name - prioritize village/town/city (most specific first)
    let city = address.village || address.town || address.city || address.municipality || null;
    
    // If no city found, check for suburb as last resort (but not ideal)
    if (!city && address.suburb) {
      console.log(`Nominatim: Using suburb as city fallback: ${address.suburb}`);
      city = address.suburb;
    }
    
    // Extract county (powiat)
    let county = address.county || null;
    if (county) {
      // Clean up "powiat" prefix if present
      county = county.replace(/^powiat\s+/i, '');
    }
    
    // Extract voivodeship
    let voivodeship = address.state || null;
    if (voivodeship) {
      // Normalize voivodeship name
      const normalizedVoivodeship = voivodeship.toLowerCase().trim();
      voivodeship = voivodeshipMappings[normalizedVoivodeship] || null;
    }
    
    console.log(`Nominatim: Resolved to city="${city}", county="${county}", voivodeship="${voivodeship}"`);
    
    return { city, county, voivodeship };
  } catch (error) {
    console.error("Reverse geocoding error:", error);
    return null;
  }
};

export function useSmartGeolocation() {
  const { user } = useAuth();
  const isDetectingRef = useRef(false);
  
  const [state, setState] = useState<SmartGeolocationState>({
    location: { voivodeship: null, county: null, city: null, coordinates: null },
    isDetecting: false,
    error: null,
    detectionPhase: "idle",
  });

  // Save location to localStorage and database
  const saveLocation = useCallback(async (location: UserLocation) => {
    localStorage.setItem("userSettings", JSON.stringify({
      voivodeship: location.voivodeship,
      county: location.county,
      city: location.city,
      coordinates: location.coordinates,
    }));
    localStorage.setItem("locationPrompted", "true");

    if (user) {
      try {
        const { data: existing } = await supabase
          .from("user_site_settings")
          .select("id")
          .eq("user_id", user.id)
          .maybeSingle();

        const siteData = {
          voivodeship: location.voivodeship,
          county: location.county,
          city: location.city,
        };

        if (existing) {
          await supabase
            .from("user_site_settings")
            .update(siteData)
            .eq("user_id", user.id);
        } else {
          await supabase
            .from("user_site_settings")
            .insert({ user_id: user.id, ...siteData });
        }
      } catch (error) {
        console.error("Error saving location to database:", error);
      }
    }
  }, [user]);

  // Two-step GPS detection with fallback
  const detectWithGPS = useCallback((): Promise<{ coords: GeolocationCoordinates } | null> => {
    return new Promise((resolve) => {
      if (!navigator.geolocation) {
        resolve(null);
        return;
      }

      // Step 1: Try high accuracy first (5s timeout)
      navigator.geolocation.getCurrentPosition(
        (position) => {
          console.log("High accuracy GPS succeeded");
          resolve(position);
        },
        (highAccuracyError) => {
          console.log("High accuracy GPS failed:", highAccuracyError.code, "- trying low accuracy fallback");
          
          // Step 2: Fallback to low accuracy (network-based)
          navigator.geolocation.getCurrentPosition(
            (position) => {
              console.log("Low accuracy GPS succeeded");
              resolve(position);
            },
            (lowAccuracyError) => {
              console.error("Both GPS attempts failed:", lowAccuracyError.code);
              resolve(null);
            },
            {
              enableHighAccuracy: false,
              timeout: 10000,
              maximumAge: 30000,
            }
          );
        },
        {
          enableHighAccuracy: true,
          timeout: 5000,
          maximumAge: 0,
        }
      );
    });
  }, []);

  // Browser geolocation with specific options (legacy method for permission handling)
  const detectWithBrowserOptions = useCallback((
    options: PositionOptions
  ): Promise<DetectionResult> => {
    return new Promise((resolve) => {
      if (!navigator.geolocation) {
        resolve({ success: false, error: "NOT_SUPPORTED" });
        return;
      }

      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude } = position.coords;
          const coordinates: Coordinates = { lat: latitude, lng: longitude };
          
          // Try reverse geocoding first for precise location
          setState(prev => ({ ...prev, detectionPhase: "reverse_geocoding" }));
          const reverseResult = await reverseGeocode(latitude, longitude);
          
          if (reverseResult && (reverseResult.city || reverseResult.voivodeship)) {
            const location: UserLocation = {
              voivodeship: reverseResult.voivodeship,
              county: reverseResult.county,
              city: reverseResult.city,
              coordinates,
              method: "browser",
              detectedAt: new Date().toISOString(),
            };
            resolve({ success: true, location });
            return;
          }
          
          // Fallback to proximity matching if reverse geocoding fails
          console.log("Reverse geocoding failed, falling back to proximity matching");
          const nearest = findNearestCity(latitude, longitude);
          
          if (nearest.distance < 60) {
            const exactMatch = findCityInDivisions(nearest.name);
            
            const location: UserLocation = exactMatch ? {
              voivodeship: exactMatch.voivodeship,
              county: exactMatch.powiat,
              city: exactMatch.city,
              coordinates,
              method: "browser",
              detectedAt: new Date().toISOString(),
            } : {
              voivodeship: nearest.voivodeship,
              county: nearest.powiat,
              city: nearest.name,
              coordinates,
              method: "browser",
              detectedAt: new Date().toISOString(),
            };

            resolve({ success: true, location });
          } else {
            // Too far from any known city, but we still have coordinates
            resolve({
              success: true,
              location: {
                voivodeship: null,
                county: null,
                city: null,
                coordinates,
                method: "browser",
                detectedAt: new Date().toISOString(),
              }
            });
          }
        },
        (error) => {
          let errorType: GeolocationErrorType;
          switch (error.code) {
            case error.PERMISSION_DENIED:
              errorType = "PERMISSION_DENIED";
              break;
            case error.POSITION_UNAVAILABLE:
              errorType = "POSITION_UNAVAILABLE";
              break;
            case error.TIMEOUT:
              errorType = "TIMEOUT";
              break;
            default:
              errorType = "UNKNOWN";
          }
          resolve({ success: false, error: errorType });
        },
        options
      );
    });
  }, []);

  // IP-based fallback detection with multiple API sources
  const detectWithIP = useCallback(async (): Promise<DetectionResult> => {
    try {
      const ipResponse = await fetch('https://api.ipify.org?format=json');
      const ipData = await ipResponse.json();
      const clientIP = ipData.ip;

      // Try multiple geolocation APIs - ip-api.com is more accurate for Poland
      const geoAPIs = [
        async () => {
          const response = await fetch(`http://ip-api.com/json/${clientIP}?fields=status,country,regionName,city,lat,lon`);
          const data = await response.json();
          if (data.status === 'success' && data.country === 'Poland') {
            return { city: data.city, region: data.regionName, lat: data.lat, lon: data.lon };
          }
          return null;
        },
        async () => {
          const response = await fetch(`https://ipwho.is/${clientIP}`);
          const data = await response.json();
          if (data.success && data.country === 'Poland') {
            return { city: data.city, region: data.region, lat: data.latitude, lon: data.longitude };
          }
          return null;
        },
      ];

      for (const apiCall of geoAPIs) {
        try {
          const result = await apiCall();
          if (result) {
            const coordinates: Coordinates | null = (result.lat && result.lon) 
              ? { lat: result.lat, lng: result.lon } 
              : null;
            
            // Try reverse geocoding for IP-based coordinates too
            if (coordinates) {
              const reverseResult = await reverseGeocode(coordinates.lat, coordinates.lng);
              if (reverseResult && (reverseResult.city || reverseResult.voivodeship)) {
                return {
                  success: true,
                  location: {
                    voivodeship: reverseResult.voivodeship,
                    county: reverseResult.county,
                    city: reverseResult.city,
                    coordinates,
                    method: "ip",
                    detectedAt: new Date().toISOString(),
                  }
                };
              }
              
              // Fallback to proximity matching
              const nearest = findNearestCity(coordinates.lat, coordinates.lng);
              
              if (nearest.distance < 60) {
                return {
                  success: true,
                  location: {
                    voivodeship: nearest.voivodeship,
                    county: nearest.powiat,
                    city: nearest.name,
                    coordinates,
                    method: "ip",
                    detectedAt: new Date().toISOString(),
                  }
                };
              }
            }

            // Fallback to name matching
            const city = result.city?.toLowerCase().trim() || '';
            const cityMatch = findCityInDivisions(city);
            if (cityMatch) {
              return {
                success: true,
                location: {
                  voivodeship: cityMatch.voivodeship,
                  county: cityMatch.powiat,
                  city: cityMatch.city,
                  coordinates,
                  method: "ip",
                  detectedAt: new Date().toISOString(),
                }
              };
            }
            
            const voivodeship = findVoivodeship(result.region || '');
            if (voivodeship) {
              return {
                success: true,
                location: { 
                  voivodeship, 
                  county: null, 
                  city: null, 
                  coordinates,
                  method: "ip", 
                  detectedAt: new Date().toISOString() 
                }
              };
            }
          }
        } catch { continue; }
      }
      
      return { success: false, error: "POSITION_UNAVAILABLE", message: "Nie wykryto lokalizacji w Polsce" };
    } catch (error) {
      console.error("IP geolocation error:", error);
      return { success: false, error: "UNKNOWN", message: "Błąd pobierania lokalizacji przez IP" };
    }
  }, []);

  // Main smart detection function with progressive fallback
  const detectLocation = useCallback(async (): Promise<UserLocation | null> => {
    // Prevent multiple simultaneous detections
    if (isDetectingRef.current) {
      return null;
    }

    // Security check
    if (typeof window !== 'undefined' && !window.isSecureContext) {
      toast.error("Geolokalizacja wymaga bezpiecznego połączenia HTTPS");
      setState(prev => ({
        ...prev,
        error: "NOT_SECURE",
        detectionPhase: "error",
      }));
      return null;
    }

    isDetectingRef.current = true;
    setState(prev => ({ ...prev, isDetecting: true, error: null, detectionPhase: "high_accuracy" }));

    try {
      // Phase 1: Two-step GPS detection (high accuracy -> low accuracy fallback)
      toast.loading("Szukam sygnału GPS...", { id: "geolocation" });
      
      const gpsResult = await detectWithGPS();

      if (gpsResult) {
        const { latitude, longitude } = gpsResult.coords;
        const coordinates: Coordinates = { lat: latitude, lng: longitude };
        
        // Use reverse geocoding for precise location name
        setState(prev => ({ ...prev, detectionPhase: "reverse_geocoding" }));
        toast.loading("Określam dokładną lokalizację...", { id: "geolocation" });
        
        const reverseResult = await reverseGeocode(latitude, longitude);
        
        if (reverseResult && (reverseResult.city || reverseResult.voivodeship)) {
          const location: UserLocation = {
            voivodeship: reverseResult.voivodeship,
            county: reverseResult.county,
            city: reverseResult.city,
            coordinates,
            method: "browser",
            detectedAt: new Date().toISOString(),
          };
          
          await saveLocation(location);
          setState(prev => ({
            ...prev,
            location,
            isDetecting: false,
            detectionPhase: "success",
          }));
          
          const displayName = location.city || location.county || location.voivodeship;
          toast.success(`Wykryto lokalizację: ${displayName}`, { id: "geolocation" });
          
          isDetectingRef.current = false;
          return location;
        }
        
        // Fallback to proximity matching if reverse geocoding fails
        console.log("Reverse geocoding failed, using proximity matching as fallback");
        const nearest = findNearestCity(latitude, longitude);
        const exactMatch = findCityInDivisions(nearest.name);
        
        const location: UserLocation = exactMatch ? {
          voivodeship: exactMatch.voivodeship,
          county: exactMatch.powiat,
          city: exactMatch.city,
          coordinates,
          method: "browser",
          detectedAt: new Date().toISOString(),
        } : {
          voivodeship: nearest.voivodeship,
          county: nearest.powiat,
          city: nearest.name,
          coordinates,
          method: "browser",
          detectedAt: new Date().toISOString(),
        };
        
        await saveLocation(location);
        setState(prev => ({
          ...prev,
          location,
          isDetecting: false,
          detectionPhase: "success",
        }));
        
        const displayName = location.city || location.county || location.voivodeship;
        toast.success(`Wykryto lokalizację: ${displayName}`, { id: "geolocation" });
        
        isDetectingRef.current = false;
        return location;
      }

      // Check for permission denied using legacy method
      setState(prev => ({ ...prev, detectionPhase: "low_accuracy" }));
      const permissionCheck = await detectWithBrowserOptions({
        enableHighAccuracy: false,
        timeout: 3000,
        maximumAge: 60000,
      });

      if (permissionCheck.error === "PERMISSION_DENIED") {
        toast.error(getErrorMessage("PERMISSION_DENIED"), { id: "geolocation", duration: 6000 });
        setState(prev => ({
          ...prev,
          isDetecting: false,
          error: "PERMISSION_DENIED",
          detectionPhase: "error",
        }));
        isDetectingRef.current = false;
        return null;
      }

      if (permissionCheck.success && permissionCheck.location) {
        await saveLocation(permissionCheck.location);
        setState(prev => ({
          ...prev,
          location: permissionCheck.location!,
          isDetecting: false,
          detectionPhase: "success",
        }));
        
        const displayName = permissionCheck.location.city || 
          permissionCheck.location.county || 
          permissionCheck.location.voivodeship;
        toast.success(`Wykryto lokalizację: ${displayName}`, { id: "geolocation" });
        
        isDetectingRef.current = false;
        return permissionCheck.location;
      }

      // Phase 3: IP-based fallback
      setState(prev => ({ ...prev, detectionPhase: "ip_fallback" }));
      toast.loading("Próbuję wykryć po adresie IP...", { id: "geolocation" });

      const ipResult = await detectWithIP();

      if (ipResult.success && ipResult.location) {
        await saveLocation(ipResult.location);
        setState(prev => ({
          ...prev,
          location: ipResult.location!,
          isDetecting: false,
          detectionPhase: "success",
        }));
        
        const displayName = ipResult.location.city || 
          ipResult.location.county || 
          ipResult.location.voivodeship;
        toast.success(`Wykryto lokalizację (IP): ${displayName}`, { id: "geolocation" });
        
        isDetectingRef.current = false;
        return ipResult.location;
      }

      // All methods failed
      const errorMsg = "Nie udało się wykryć lokalizacji. Wybierz ręcznie.";
      toast.error(errorMsg, { id: "geolocation" });
      setState(prev => ({
        ...prev,
        isDetecting: false,
        error: errorMsg,
        detectionPhase: "error",
      }));
      
      isDetectingRef.current = false;
      return null;

    } catch (error) {
      console.error("Smart geolocation error:", error);
      const errorMsg = "Wystąpił błąd podczas wykrywania lokalizacji";
      toast.error(errorMsg, { id: "geolocation" });
      setState(prev => ({
        ...prev,
        isDetecting: false,
        error: errorMsg,
        detectionPhase: "error",
      }));
      
      isDetectingRef.current = false;
      return null;
    }
  }, [detectWithGPS, detectWithBrowserOptions, detectWithIP, saveLocation]);

  // Clear error state
  const clearError = useCallback(() => {
    setState(prev => ({ ...prev, error: null, detectionPhase: "idle" }));
  }, []);

  // Check if secure context
  const isSecureContext = typeof window !== 'undefined' ? window.isSecureContext : true;

  return {
    ...state,
    detectLocation,
    saveLocation,
    clearError,
    isSecureContext,
  };
}
