# Supported Locales

MAS Studio supports the following locales for card content. When creating cards, you can create locale variations to serve different regions.

## Locales by Region

### Americas

| Locale Code | Country |
|-------------|--------|
| `en_US` | United States |
| `en_CA` | Canada (English) |
| `fr_CA` | Canada (French) |
| `pt_BR` | Brazil |
| `es_MX` | Mexico |

### Asia Pacific

| Locale Code | Country |
|-------------|--------|
| `en_AU` | Australia |
| `ja_JP` | Japan |
| `ko_KR` | South Korea |
| `zh_CN` | China |
| `zh_TW` | Taiwan |
| `id_ID` | Indonesia |
| `th_TH` | Thailand |
| `vi_VN` | Vietnam |

### Europe

| Locale Code | Country |
|-------------|--------|
| `fr_FR` | France |
| `de_DE` | Germany |
| `it_IT` | Italy |
| `es_ES` | Spain |
| `nl_NL` | Netherlands |
| `sv_SE` | Sweden |
| `nb_NO` | Norway |
| `da_DK` | Denmark |
| `fi_FI` | Finland |
| `pl_PL` | Poland |
| `cs_CZ` | Czech Republic |
| `ru_RU` | Russia |
| `uk_UA` | Ukraine |
| `tr_TR` | Türkiye |
| `hu_HU` | Hungary |

## How Locale Variations Work

1. **Parent Fragment**: Create your card in the default locale (usually `en_US`)
2. **Create Variation**: In Studio, select "Create Locale Variation"
3. **Inherit or Override**: Fields inherit from parent unless you override them
4. **Same Language Only**: You can only create variations for locales that share the same language (e.g., `en_US` → `en_AU`)

