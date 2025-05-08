# Tipply to StreamElements 

Proste narzędzie, które pozwala przekierowywać donacje z Tipply do StreamElements.

## Poradnik

### 1. Otwórz ustawienia paneli przeglądarkowych w OBS

**UWAGA:**
Strona musi być cały czas aktywna, aby przekierowywanie działało. Dlatego dodajemy ją jako panel przeglądarkowy – będzie wtedy zawsze włączona razem z OBS.

Na samej górze OBS:
`Panele > Panele przeglądarki` lub `Docks > Custom Browser Docks`.

![Podgląd aplikacji](https://i.imgur.com/FTVlzo8.png)

### 2. Utwórz nowy panel przeglądarkowy z linkiem `https://tipply-to-se.onrender.com`

Wprowadź dowolną `nazwę panelu` i uzupełnij `URL`.

![Podgląd aplikacji](https://i.imgur.com/cv9lwNw.png)

### 3. Dodaj panel do OBS

Żeby dodać nowo utworzony panel klikamy `Panele/Docks > [Nasza nazwa panelu]`.

![Podgląd aplikacji](https://i.imgur.com/ZpRW5sY.png)

Panel można umieścić w przykładowy sposób: 

![Podgląd aplikacji](https://i.imgur.com/YLRLqT0.png)

### 4. Uzupełnij dane w ustawieniach aplikacji

- **Tipply URL**: znajdziesz go tutaj → https://app.tipply.pl/konfigurator/powiadomienie-o-wiadomosci (to po prostu link do alertów)
- **JWT Token (StreamElements)**: znajdziesz go tutaj → https://streamelements.com/dashboard/account/channels  
  Token ważny jest przez około 6 miesięcy i trzeba go później ręcznie odnowić.

![Podgląd aplikacji](https://i.imgur.com/ZsyetIi.png)

### 5. Sprawdź status połączenia

W głównym panelu aplikacji widoczny jest:
- **Status połączenia z `Tipply`**
- **Czas do wygaśnięcia `JWT Tokena`**

![Podgląd aplikacji](https://i.imgur.com/bAXK45b.png)

## Dodatkowe informacje

- Wszystkie dane są przechowywane lokalnie w przeglądarce (localStorage)
- `JWT Token` jest używany tylko do emulowania donacji przez API StreamElements
- `Tipply URL` służy wyłącznie do połączenia z websocketem Tipply i nasłuchiwania donacji
- Aplikacja **nie zbiera ani nie przesyła** wprowadzonych danych
- W razie braku zaufania do mojej aplikacji w wersji online, można z niej korzystać lokalnie: 
  - Pobrać wszystkie pliki (+ ogarnąć kogoś do sprawdzenia legitności skryptu <img style="height: 20px; transform: translateY(5px);" src="https://cdn.7tv.app/emote/01GB3PQ1K8000CW87FDNNPRBZG/1x.avif">) 
  - Wrzucić pliki do jakiegoś folderu

    ![Podgląd aplikacji](https://i.imgur.com/Uo1h4oy.png)   
  - Zamiast `https://tipply-to-se.onrender.com` podpiąć plik lokalny np. `C:/Users/User/Desktop/tipply/index.html`

    ![Podgląd aplikacji](https://i.imgur.com/PFUey2s.png)


