
//triggers the search when user hits enter on the search box
document.getElementById("search").addEventListener("keydown", (e) => {
  if (e.keyCode === 13) {
    e.preventDefault();
    const q = document.getElementById("search").value;
    const navigateTo = "/search?q=" + encodeURI(q);
    window.location.href = navigateTo;
  }
})


// prepare the search index
const idx = lunr(function () {
  // Search these fields
  this.ref('id')
  this.field('title', {
    boost: 15
  })
  this.field('tags')
  this.field('content', {
    boost: 10
  })

  // Add the documents from your search index to
  // provide the data to idx
  for (const key in window.searchIndex) {
    this.add({
      id: key,
      title: window.searchIndex[key].title,
      tags: window.searchIndex[key].category,
      content: window.searchIndex[key].content
    })
  }
})


// if a search was done

if (query) {
  // create the search result list
  // we use ".post-preview" in themes/4.0/layouts/search/list.html as a template
  // clone it, change the fields, and inject into the view
  const results = idx.search(query)

  const postContainer = $('.posts-container')
  const postTemplate = postContainer.find(".post-template")

  if (results.length > 0) {

    const l = results.map(r => {
      const item = window.searchIndex[r.ref]
      const post = postTemplate.clone()

      const titleLink = post.find(".post-preview-title-link")
      titleLink.text(item.title)
      titleLink.attr("href", item.url)

      post.find(".post-preview-excerpt").html(item.summary)
      post.find(".post-preview-read-more a").attr("href", item.url)
      post.find(".post-image").attr("src", item.preview)

      return post
    })

    postContainer.html("")
    postContainer.append(l)
  }
  else {
    postTemplate.hide()
  }

}


