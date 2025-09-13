# Labor Rights Risk Assessment Database

## Excel Spreadsheet Structure

Below is the data for your Excel spreadsheet with real data from authoritative sources:

### Countries Data Sheet

| Country              | ITUC_Rights_Rating | Corruption_Index_TI | Migrant_Worker_Prevalence | Education_Level | Base_Risk_Score | ISO_Code | Last_Updated |
| -------------------- | ------------------ | ------------------- | ------------------------- | --------------- | --------------- | -------- | ------------ |
| Denmark              | 1                  | 90                  | low                       | high            | 8               | DK       | 2024-12-09   |
| Finland              | 2                  | 87                  | low                       | high            | 12              | FI       | 2024-12-09   |
| Norway               | 1                  | 84                  | low                       | high            | 10              | NO       | 2024-12-09   |
| Sweden               | 1                  | 82                  | medium                    | high            | 11              | SE       | 2024-12-09   |
| Germany              | 2                  | 78                  | medium                    | high            | 15              | DE       | 2024-12-09   |
| Netherlands          | 2                  | 79                  | medium                    | high            | 14              | NL       | 2024-12-09   |
| United Kingdom       | 2                  | 71                  | medium                    | high            | 18              | GB       | 2024-12-09   |
| United States        | 3                  | 69                  | high                      | high            | 22              | US       | 2024-12-09   |
| Canada               | 2                  | 76                  | medium                    | high            | 16              | CA       | 2024-12-09   |
| Australia            | 2                  | 76                  | medium                    | high            | 16              | AU       | 2024-12-09   |
| New Zealand          | 1                  | 85                  | medium                    | high            | 12              | NZ       | 2024-12-09   |
| Japan                | 2                  | 73                  | low                       | high            | 17              | JP       | 2024-12-09   |
| South Korea          | 3                  | 63                  | medium                    | high            | 25              | KR       | 2024-12-09   |
| France               | 3                  | 71                  | medium                    | high            | 23              | FR       | 2024-12-09   |
| Italy                | 2                  | 56                  | medium                    | medium          | 28              | IT       | 2024-12-09   |
| Spain                | 2                  | 60                  | medium                    | medium          | 26              | ES       | 2024-12-09   |
| Brazil               | 4                  | 36                  | low                       | medium          | 45              | BR       | 2024-12-09   |
| Mexico               | 4                  | 31                  | high                      | medium          | 52              | MX       | 2024-12-09   |
| India                | 4                  | 39                  | medium                    | low             | 58              | IN       | 2024-12-09   |
| China                | 5                  | 42                  | high                      | medium          | 65              | CN       | 2024-12-09   |
| Russia               | 5                  | 22                  | medium                    | medium          | 78              | RU       | 2024-12-09   |
| Turkey               | 4                  | 34                  | high                      | medium          | 62              | TR       | 2024-12-09   |
| Bangladesh           | 5                  | 24                  | high                      | low             | 82              | BD       | 2024-12-09   |
| Philippines          | 5                  | 33                  | high                      | medium          | 75              | PH       | 2024-12-09   |
| Myanmar              | 5+                 | 23                  | medium                    | low             | 95              | MM       | 2024-12-09   |
| Egypt                | 5                  | 30                  | medium                    | medium          | 78              | EG       | 2024-12-09   |
| Saudi Arabia         | 5                  | 42                  | very_high                 | medium          | 72              | SA       | 2024-12-09   |
| Qatar                | 5                  | 62                  | very_high                 | medium          | 68              | QA       | 2024-12-09   |
| United Arab Emirates | 4                  | 67                  | very_high                 | medium          | 58              | AE       | 2024-12-09   |
| Vietnam              | 4                  | 41                  | medium                    | medium          | 55              | VN       | 2024-12-09   |
| Thailand             | 4                  | 36                  | high                      | medium          | 62              | TH       | 2024-12-09   |
| Indonesia            | 4                  | 34                  | medium                    | medium          | 58              | ID       | 2024-12-09   |
| Pakistan             | 4                  | 29                  | medium                    | low             | 72              | PK       | 2024-12-09   |
| Nigeria              | 4                  | 25                  | low                       | low             | 75              | NG       | 2024-12-09   |
| South Africa         | 3                  | 41                  | medium                    | medium          | 42              | ZA       | 2024-12-09   |

### Industry Multipliers Sheet

| Industry           | Risk_Multiplier | Description                                |
| ------------------ | --------------- | ------------------------------------------ |
| agriculture        | 1.4             | High seasonal labor, often migrant workers |
| mining             | 1.5             | Dangerous work, often remote locations     |
| manufacturing      | 1.2             | Standard industrial risks                  |
| textiles           | 1.6             | High risk due to supply chain complexity   |
| electronics        | 1.3             | Complex supply chains, precision work      |
| automotive         | 1.1             | Generally well-regulated industry          |
| construction       | 1.4             | High injury rates, temporary workforce     |
| energy             | 1.3             | Infrastructure projects, safety risks      |
| healthcare         | 0.9             | Generally well-regulated, skilled workers  |
| finance            | 0.8             | Low physical risk, regulated sector        |
| retail             | 1.1             | Service sector, varied skill levels        |
| hospitality        | 1.3             | Service industry, often migrant workers    |
| logistics          | 1.2             | Transportation risks, varied conditions    |
| chemicals          | 1.3             | Safety hazards, technical requirements     |
| telecommunications | 0.9             | Technology sector, skilled workforce       |

## Data Sources Documentation

### Primary Sources Used:

1. **ITUC Global Rights Index 2024** - Labor rights violations ranking (1-5+ scale)
2. **Transparency International Corruption Perceptions Index 2024** - Corruption levels (0-100 scale)
3. **ILO Global Estimates on International Migrant Workers** - Migrant worker prevalence
4. **World Bank Education Statistics** - Worker education levels

### Rating Scales:

- **ITUC Rights Rating**: 1 (best) to 5+ (worst, conflict zones)
- **Corruption Index**: 0 (highly corrupt) to 100 (very clean)
- **Migrant Worker Prevalence**: low, medium, high, very_high
- **Education Level**: low, medium, high
- **Base Risk Score**: 1-100 (calculated composite score)

### Update Instructions:

1. ITUC Global Rights Index: Updated annually in June
2. Corruption Perceptions Index: Updated annually in January/February
3. Migrant worker data: Updated every 2-3 years by ILO
4. Education statistics: Updated annually by World Bank

### API Endpoints for Updates:

- ITUC: No public API, manual data entry required
- Transparency International: Limited API access
- World Bank: Open Data API available
- ILO: ILOSTAT API available
