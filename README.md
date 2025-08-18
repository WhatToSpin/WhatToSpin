# <img src="build/icon.png" height=20px style="margin-right:10px"></img> What to Spin

## Download
To download the app, go to [Releases](https://github.com/ethanburmane/what-to-spin/releases) and download the correct release for your OS:

- MacOS: `.dmg`
- Windows: 
- Linux:

## Features 

### Add 
- Save albums from your vinyl collection
- Save album name, artist name, and the release year (optional)

### Shuffle 
- Press the shuffle button to randomly select an album from your collection

### Edit 
- Edit album information, upload different album covers, and delete albums from your collection

### Search
- Search through your collection using keywords
- Search for a specific (but case insensitive) phrase using quotations (e.g., `"Abbey Road"`)
- Search for a time range using the keyword `year` followed by a comparative operator `>`, `<`, `>=`, `<=` (e.g., `year>=2015`)
- Alternatively, use the `from:` or `to:` operations to the same effect (e.g., `from:2015`)
- Use the `OR` operator to match with either of the keywords provided (e.g., `"The Beatles" OR "Led Zeppelin"`)

### Sort
- Choose how your albums are sorted
- Sort by `Album`
- Sort by `Year`
- Sort by `Date Added`

### Info 
- See stats on your collection, including collection size, number of artists, largest discography, and the years your collection spans
- See the distribution of your albums across each decade


## Dependancies 
This application uses the package [album-art](https://github.com/lacymorrow/album-art) to source the cover artwork for each added album


## Development

To download the source code, clone this repository:

```
git clone https://github.com/ethanburmane/what-to-spin
```

Set up the environment by running:
```
npm install
```
