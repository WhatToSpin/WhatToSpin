<div align="center">
  <img src="https://github.com/user-attachments/assets/a66ade39-0e4e-4cb0-8243-ced8bcfc4172" height="120px">
  <img src="https://github.com/user-attachments/assets/e859afee-993e-4068-a676-0b040e26f4ad" height="120px">
  <h2>Catalog your record collection and find what to spin</h2>
  <img src="https://github.com/user-attachments/assets/e66f05a5-cd1e-467e-9a3f-3970ffa06833">
</div>

<p align="center">
  <a href="https://github.com/username/repo/releases/latest/download/What-to-Spin-1.2.1-arm64.dmg">
    <img src="https://img.shields.io/badge/Download-Mac%20Apple%20Silicon-blue?style=for-the-badge&logo=apple" alt="Download for Mac Apple Silicon">
  </a>
  &nbsp;&nbsp;&nbsp;
  <a href="https://github.com/username/repo/releases/latest/download/What-to-Spin-1.2.1.dmg">
    <img src="https://img.shields.io/badge/Download-Mac%20Intel-lightblue?style=for-the-badge&logo=apple" alt="Download for Mac Intel">
  </a>
</p>
<p align="center">
  <a href="https://github.com/username/repo/releases/latest/download/What-to-Spin-Setup-1.2.1.exe">
    <img src="https://img.shields.io/badge/Download-Windows%20Installer-green?style=for-the-badge&logo=windows" alt="Download for Windows">
  </a>
</p>

# About
**What To Spin** is a desktop application for building a digital catalog of your vinyl collection
- Add albums from your collection
- Search for specific records
- View information about your collection
- Shuffle your collection to get a random album to spin

# FAQ

### Why is the cover incorrect for my record?

To source the album covers, I use the package [album-art](https://github.com/lacymorrow/album-art) which uses the Spotify API to fetch each cover

Unfortuatly, Spotify tends to favor newer covers (e.g., deluxe editions, anniversary editions, etc.) and struggles to return the correct cover for albums in a series (e.g., "Led Zeppelin" will return "Led Zeppelin IV" and "SATURATION" will return "SATURATION III")

I will work on improving the accuracy of the covers, but for now if a cover is incorrect you can change it manually by editing the album's information


## Development

To download the source code, clone the repository

```
git clone https://github.com/ethanburmane/what-to-spin
```

and set up the environment
```
npm install
```

Developing locally will access the same files as your application &mdash; to avoid editing your collection you can run
```
npm run save
```

This will move your collection to a new file so you can test the application worry free

To restore your collection you can run 
```
npm run restore
```
