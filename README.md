# Tipply to StreamElements 

Proste narzędzie, które pozwala prziekerować donacje z tipply do streamelements.

## Poradnik

#### 1. Otwórz ustawienia paneli przeglądarkowych w OBS (na samej górze).

![Podgląd aplikacji](https://i.imgur.com/FTVlzo8.png) 

#### 2. Utwórz nowy panel przeglądarkowy z linkiem: `https://tipply-to-se.onrender.com`

![Podgląd aplikacji](https://i.imgur.com/48UZijQ.png) 

#### 3. Panel można umieścić np. w taki sposób:

Strona musi być cały czas włączona żeby przekierowywanie działało. Dlatego dodajemy ją jako panel żeby była zawsze włączona razem z OBS.

![Podgląd aplikacji](https://i.imgur.com/YLRLqT0.png) 

#### 4. W ustawieniach aplikacji uzupełniamy `SE JWT Token` oraz `Tipply URL`
* Link do tipply znajdziemy tutaj: https://app.tipply.pl/konfigurator/powiadomienie-o-wiadomosci. Jest to zwykły link do alertów.
* JWT Token ze streamelements znajdziemy tutaj: https://streamelements.com/dashboard/account/channels. JWT działa przez ograniczony czas, na SE jest to około 6 miesięcy i trzeba go będzie ręcznie wymieniać.

![Podgląd aplikacji](https://i.imgur.com/ZsyetIi.png)

#### 5. W główym panelu aplikacji widać <b>status połączenia</b> z tipply oraz za ile czasu `JWT Token` wygaśnie.

![Podgląd aplikacji](https://i.imgur.com/bAXK45b.png)

## Dodatkowe informacje
- Wszystkie dane są przechowywane lokalnie w przeglądarce `(localstorage)`
- `Token JWT` jest używany tylko do komunikacji z API StreamElements
- Aplikacja nie zbiera żadnych danych
- W razie braku zaufania do mojej aplikacji, można pobrać wszystkie pliki, wrzucić do folderu i zamiast `https://tipply-to-se.onrender.com` podpiąć plik lokalny np. `C:/Users/User/Desktop/tipply/index.html`

![Podgląd aplikacji](https://i.imgur.com/yNxjHaj.png)
![Podgląd aplikacji](https://i.imgur.com/vzLYUUL.png)
