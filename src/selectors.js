/**
 * DOM selectors.
 * */
const { parse } = require('node-html-parser')

// Parse with cheerio
const parseHTML = data => parse(data, { script: true })

const toArray = data => [...data]

// Search a variable in scripts (for episodes and anime details)
const extractVariableValue = (dom, variableName) => {
  const variable = `${variableName} =`

  const scripts = dom.querySelectorAll('script')

  const episodesScript = toArray(scripts).find(item =>
    item.innerHTML.includes(variable),
  )

  if (!episodesScript) return

  const scriptInnerHTML = episodesScript.innerHTML

  const startIndex = scriptInnerHTML.indexOf(variable) + variable.length
  const endIndex = scriptInnerHTML.indexOf(';', startIndex)
  const valueString = scriptInnerHTML.substring(startIndex, endIndex)

  return valueString
}

const extractEpisodes = dom => {
  const episodes = extractVariableValue(dom, 'var episodes') || '[]'
  const episodesJSON = JSON.parse(episodes)

  const formatedEpisodes = episodesJSON.map(item => ({
    index: item[0],
    id: item[1],
  }))

  return formatedEpisodes
}

const formatAnimeList = dom => (element, i) => {
  const link = element.querySelector('a').attributes.href
  const title = link.split('/')[2]

  // Add fallback if src attr is not found
  const imageElement = dom.querySelectorAll('.Image img')[i]
  const image =
    imageElement.attributes.src ||
    `https://animeflv.net${imageElement.attributes['data-cfsrc']}`

  const label = element.querySelector('.Title').innerHTML
  const type = element.querySelector('.Image span.Type').innerHTML

  return {
    link,
    title,
    image,
    label,
    type,
  }
}

const extractAnimeList = dom => {
  const animeElements = dom.querySelectorAll('.Anime')
  return toArray(animeElements).map(formatAnimeList(dom))
}

const extractAnimeGenres = dom => {
  const genresElements = dom.querySelectorAll('.Nvgnrs a')
  return toArray(genresElements).map(element => element.innerHTML)
}

const extractAnimeBasicInfo = dom => {
  const animeBasicInfo = extractVariableValue(dom, 'var anime_info') || '[]'
  const [index, label, title] = JSON.parse(animeBasicInfo)

  return {
    index,
    label,
    title,
  }
}

const extractAnimeDetails = dom => {
  const animeBasicInfo = extractAnimeBasicInfo(dom)

  return {
    ...animeBasicInfo,
    rate: dom.querySelector('#votes_prmd').innerHTML,
    votes: dom.querySelector('#votes_nmbr').innerHTML,
    genres: extractAnimeGenres(dom),
    description: dom.querySelector('.Description p').innerHTML.trim(),
    episodes: extractEpisodes(dom),
  }
}

const extractVideoSources = dom => {
  const videosRAW = extractVariableValue(dom, 'var videos') || '{}'
  const { SUB: videos } = JSON.parse(videosRAW)
  const videoSources = videos.map(item => item.code)
  const downloadLink = extractDownloadLink(videos)

  return {
    videos: videoSources,
    downloads: downloadLink,
  }
}

const extractDownloadLink = videos => {
  const downloadLink = videos.find(item => item.server === 'mega')
  return downloadLink !== undefined ? downloadLink.url : ''
}

const extractLatestEpisodes = dom => {
  const latestEpisodes = dom.querySelectorAll('.ListEpisodios li')



  return latestEpisodes.map(element => {
    const [, , title] = element
      .querySelector('a')
      .getAttribute('href')
      .split('/')

    return {
      title,
      label: element.querySelector('.Title').text,
      episode: element.querySelector('.Capi').text,
      image: 'https://animeflv.net'+element.querySelector('img').getAttribute('src')
    }
  })
}

module.exports = {
  parseHTML,
  extractAnimeDetails,
  extractAnimeList,
  extractVideoSources,
  extractLatestEpisodes,
}
