# Tipply to StreamElements 

Proste narzędzie, które pozwala przekierowywać donacje z Tipply do StreamElements.

## 💡Jak to działa?
  1. Aplikacja łączy się z `WebSocketem` Tipply, aby otrzymywać powiadomienia o donacjach
  2. Po otrzymaniu donacji, jest ona przetwarzana (nick, kwota, wiadomość)
  3. Donacja jest następnie przekazywana do `API StreamElements` za pomocą skonfigurowanego tokenu
  4. StreamElements wyświetla donację w swoim systemie alertów

 ⚠️**UWAGA:** Aplikacja musi być **cały czas aktywna**, aby przekierowywanie donacji działało. Dlatego dodajemy ją jako panel przeglądarkowy – będzie wtedy zawsze włączona razem z OBS.

## 📖 Poradnik

### 1. Otwórz ustawienia paneli przeglądarkowych w OBS 

Na samej górze OBS:
`Panele > Panele przeglądarki` lub `Docks > Custom Browser Docks`.

![Ustawienia paneli OBS](https://i.imgur.com/FTVlzo8.png)

### 2. Utwórz nowy panel przeglądarkowy 

- Wprowadź dowolną `nazwę panelu`
- Uzupełnij `URL` - można to zrobić na dwa sposoby:

**1. ✅ Lokalnie (*zalecane*)**

Pobierz plik [tipply-to-se.html](https://github.com/zlq23/tipply-to-se/blob/main/tipply-to-se.html) i uzupełnij pole URL scieżką do tego pliku np. `C:/Users/User/Desktop/tipply-to-se.html`.

   ![Okno paneli przeglądarek OBS](https://i.imgur.com/RWGsFsp.png)

**2. 🌐 Online** 

Wpisując link: 
```
https://zlq23.github.io/tipply-to-se/
```

![Okno paneli przeglądarek OBS](https://i.imgur.com/J41tc0C.png)

---

Panel można umieścić w dowolnym miejscu – poniżej dwa przykłady ułożenia: 

![Przykład umieszczonego panelu w OBS](https://i.imgur.com/1aShoJJ.png)

![Przykład umieszczonego panelu w OBS](https://i.imgur.com/h8MDoja.png)

Jeśli zamkniemy panel, można go łatwo przywrócić, klikając  `Panele/Docks > [Nasza nazwa panelu]`.

![Ustawienia paneli OBS](https://i.imgur.com/ZpRW5sY.png)

### 3. Uzupełnij dane w ustawieniach aplikacji

![Ustawienia aplikacji](https://i.imgur.com/5UPlgGK.png)

- `Tipply URL` (link do alertów) znajdziesz tutaj → https://app.tipply.pl/konfigurator/powiadomienie-o-wiadomosci
- `SE JWT Token` znajdziesz tutaj → https://streamelements.com/dashboard/account/channels
  
  ⚠️**UWAGA:** Token zmienia się co około **6 miesięcy**, jeśli wygaśnie, trzeba go będzie wprowadzić od nowa.

### 4. Sprawdź działanie aplikacji

W głównym panelu aplikacji widoczny jest:
- Status połączenia z **Tipply**
- Czas do wygaśnięcia **JWT Tokena**

![Panel główny aplikacji](https://i.imgur.com/bAXK45b.png)

W celu sprawdzenia działania aplikacji można wysłać testowy donate z **Tipply**. 

![Przycisk "Wyślij wiadomość testową" z tipply](https://i.imgur.com/rQ5YbrE.png)

![Okno wiadomości testowej tipply](https://i.imgur.com/r1UN7ag.png)

Jeśli wszystko działa powinniśmy zobaczyć testową donację w [panelu aktywności](https://streamelements.com/dashboard/activity) **StreamElements**.

![Panel aktywności streamelements](https://i.imgur.com/Ikd6UZQ.png)
## ℹ️ Dodatkowe informacje

- Wszystkie dane są przechowywane lokalnie w przeglądarce (localStorage)
- `JWT Token` jest używany tylko do emulowania donacji przez **API StreamElements**
- `Tipply URL` służy wyłącznie do połączenia z websocketem **Tipply** i nasłuchiwania donacji
- Aplikacja **nie zbiera ani nie przesyła** wprowadzonych danych
- W przypadku pytań, można skontaktować się przez Discord: `zalech23`
- Projekt jest częściowo bazowany na pracy `BOT-K4CP3R`: https://github.com/BOT-K4CP3R/tipplyToSe
- Kod jest czysty jak łza, ale wiadomo, w razie wątpliwości **zalecane** jest ogarnięcie kogoś, kto sprawdzi legitność skryptu <img style="height: 20px; transform: translateY(5px);" src="https://cdn.7tv.app/emote/01GB3PQ1K8000CW87FDNNPRBZG/1x.avif">

