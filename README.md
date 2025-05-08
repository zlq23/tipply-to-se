# Tipply to StreamElements 

Proste narzędzie, które pozwala przekierowywać donacje z Tipply do StreamElements.

## Jak to działa?
  1. Aplikacja łączy się z `WebSocketem` Tipply, aby otrzymywać powiadomienia o donacjach
  2. Po otrzymaniu donacji, jest ona przetwarzana (nick, kwota, wiadomość)
  3. Donacja jest następnie przekazywana do `API StreamElements` za pomocą skonfigurowanego tokenu
  4. StreamElements wyświetla donację w swoim systemie alertów

 **UWAGA:** Aplikacja musi być **cały czas aktywna**, aby przekierowywanie donacji działało. Dlatego dodajemy ją jako panel przeglądarkowy do OBS – będzie wtedy zawsze włączona razem z OBS.

## Poradnik

Aplikację można używać online przez link `https://tipply-to-se.onrender.com` lub lokalnie w sposób opisany [tutaj](#lokalna-instalacja-krok-po-kroku).

### 1. Otwórz ustawienia paneli przeglądarkowych w OBS

Na samej górze OBS:
`Panele > Panele przeglądarki` lub `Docks > Custom Browser Docks`.

![Ustawienia paneli OBS](https://i.imgur.com/FTVlzo8.png)

### 2. Utwórz nowy panel przeglądarkowy z linkiem aplikacji

Wprowadź dowolną `nazwę panelu` i uzupełnij `URL`.

```
https://tipply-to-se.onrender.com
```

![Okno paneli przeglądarek OBS](https://i.imgur.com/cv9lwNw.png)

### 3. Dodaj panel do OBS

Żeby dodać nowo utworzony panel klikamy `Panele/Docks > [Nasza nazwa panelu]`.

![Ustawienia paneli OBS](https://i.imgur.com/ZpRW5sY.png)

Panel można umieścić w przykładowy sposób: 

![Przykład umieszczonego panelu w OBS](https://i.imgur.com/YLRLqT0.png)

### 4. Uzupełnij dane w ustawieniach aplikacji

![Ustawienia aplikacji](https://i.imgur.com/ZsyetIi.png)

- `Tipply URL` (link do alertów) znajdziesz go tutaj → https://app.tipply.pl/konfigurator/powiadomienie-o-wiadomosci
- `SE JWT Token` znajdziesz go tutaj → https://streamelements.com/dashboard/account/channels
  
  Token ważny jest przez około 6 miesięcy i trzeba go później ręcznie odnowić.

### 5. Sprawdź działanie aplikacji

W głównym panelu aplikacji widoczny jest:
- **Status połączenia z `Tipply`**
- **Czas do wygaśnięcia `JWT Tokena`**

![Panel główny aplikacji](https://i.imgur.com/bAXK45b.png)

W celu sprawdzenia działania można wysłać testowy donate z **Tipply**.

![Przycisk "Wyślij wiadomość testową" z tipply](https://i.imgur.com/rQ5YbrE.png)

![Okno wiadomości testowej tipply](https://i.imgur.com/r1UN7ag.png)

Jeśli wszystko działa powinniśmy zobaczyć ten donate na **StreamElements** w panelu aktywności.

![Panel aktywności streamelements](https://i.imgur.com/Ikd6UZQ.png)
## Dodatkowe informacje

- Wszystkie dane są przechowywane lokalnie w przeglądarce (localStorage)
- `JWT Token` jest używany tylko do emulowania donacji przez API StreamElements
- `Tipply URL` służy wyłącznie do połączenia z websocketem Tipply i nasłuchiwania donacji
- Aplikacja **nie zbiera ani nie przesyła** wprowadzonych danych
- W przypadku pytań, można skontaktować się przez Discord: `zalech23`
- Projekt jest częściowo bazowany na pracy `BOT-K4CP3R`: https://github.com/BOT-K4CP3R/tipplyToSe
- W razie braku zaufania do mojej aplikacji w wersji online, można z niej korzystać lokalnie:

### Lokalna instalacja krok po kroku

0. Ogarnij kogoś do sprawdzenia legitności skryptu <img style="height: 20px; transform: translateY(5px);" src="https://cdn.7tv.app/emote/01GB3PQ1K8000CW87FDNNPRBZG/1x.avif"> 
1. Pobierz potrzebne pliki projektu *(index.html, style.css, script.js)*  
2. Umieść pobrane pliki w jednym folderze

   ![Pliki aplikacji w folderze](https://i.imgur.com/8HdQeQX.png)  
3. W OBS użyj ścieżki do pliku `index.html` zamiast linku (np. `C:/Users/User/Desktop/tipply/index.html`)

   ![Okno paneli przeglądarek OBS](https://i.imgur.com/PFUey2s.png)


