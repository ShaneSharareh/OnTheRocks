//unique ID generator from https://gist.github.com/gordonbrander/2230317
function IDGenerator() {
  // Math.random should be unique because of its seeding algorithm.
  // Convert it to base 36 (numbers + letters), and grab the first 9 characters
  // after the decimal.
  return '_' + Math.random().toString(36).substr(2, 9);
};

//RECIPE MODEL
class Recipe {
  constructor(id) {
    this.id = id;
  }

  async getRecipe() {
    try {
      const result = await fetch(`https://www.thecocktaildb.com/api/json/v1/1/lookup.php?i=${this.id}`);
      this.results = await result.json();
      const drink = this.results.drinks[0];
      this.title = drink.strDrink;
      this.author = 'NA';
      this.image = drink.strDrinkThumb;
      this.url = 'NA';
      this.instructions = drink.strInstructions;
      //extract ingredients and measures
      const newIngredients = []
      let i;
      let maxIngredients = 15; // all drinks have 15 ingredients
      for (i = 0; i <= maxIngredients; i++) {
        //if there is a measure, concat it to the ingredient
        if (drink[`strMeasure${i+1}`] && drink[`strIngredient${i+1}`]) {

          newIngredients.push(drink[`strMeasure${i+1}`] + `` + drink[`strIngredient${i+1}`])
        }
        //if measure is null, just add the ingredient aline
        else if (drink[`strIngredient${i+1}`]) {
          newIngredients.push(drink[`strIngredient${i+1}`])
        }
        //if measure AND ingredient is null, you have reached the end, break out
        else {
          break;
        }
      }
      this.ingredients = newIngredients;
    } catch (error) {
      alert("error processing drinks")

    }
  }

  parseIngredients() {
    const units = ['tbsp', 'oz', 'tsp', 'cup', 'dashes', 'twist of', 'cl', 'ml', 'spoons']
    const newIngredients = this.ingredients.map(ingredient => {

      //split ingredients into the count, unit and the ingredient itself
      const ingredientStrAry = ingredient.split(' ')
      const unitIndex = ingredientStrAry.findIndex(el => units.includes(el));

      let ingredientObj;
      if (unitIndex > -1) {
        //there is a unit
        const countAry = ingredientStrAry.slice(0, unitIndex);
        let count;
        if (countAry.length === 1) {
          count = eval(ingredientStrAry[0]);
        } else {
          count = eval(ingredientStrAry.slice(0, unitIndex).join('+'));
        }

        ingredientObj = {
          count,
          unit: ingredientStrAry[unitIndex],
          ingredient: ingredientStrAry.slice(unitIndex + 1).join(' ')
        }
      } else if (parseInt(ingredientStrAry[0], 10)) {
        //there is no unit, but first position is a number
        ingredientObj = {
          count: parseInt(ingredientStrAry[0], 10),
          unit: '',
          ingredient: ingredientStrAry.slice(1).join(' ')
        }
      } else if (unitIndex == -1) {
        //there is NOT a unit and NOT a number;
        ingredientObj = {
          count: 1,
          unit: '',
          ingredient: ingredientStrAry.slice(0).join(' ')
        }
      }
      return ingredientObj;
    });
    this.ingredients = newIngredients;
  }

  calcServings() {
    this.servings = 1;
  }

  updateServings(type) {
    // update servings
    const newServings = type === 'decrease' ? this.servings - 1 : this.servings + 1
    // update ingredients
    this.ingredients.forEach(ingredient => {
      ingredient.count = ingredient.count * (newServings / this.servings)
    });


    this.servings = newServings;
  }
}

//Shopping List Model
class ShoppingList {
  constructor() {
    this.items = [];
  }

  addItem(count, unit, ingredient) {
    const item = {
      id: IDGenerator(),
      count,
      unit,
      ingredient
    }
    this.items.push(item);
    return item;
  }

  deleteItem(id) {
    console.log(id)
    const index = this.items.findIndex(currentItem => currentItem.id === id)
    this.items.splice(index, 1);

  }

  updateCount(id, newCount) {
    this.items.find(currentItem => currentItem.id === id).count = newCount;
  }
}


//Likes class
class LikesList{
  constructor(){
    this.likes = [];
  }

  addLikes(id, title, image){
    const like = {id, title, image}
    this.likes.push(like)
    //save in local data storage
    this.saveInLocalStorage()
    return like;
}

  deleteLikes(id){
    const index = this.likes.findIndex(currentLike => currentLike.id === id)
    this.likes.splice(index, 1);

    // save data in local storage
    this.saveInLocalStorage()
  }

  isLiked(id){

    return this.likes.findIndex(currentLike => currentLike.id==id) !== -1;
  }

  getLikesLength(){
    return this.likes.length
  }

  saveInLocalStorage(){
    localStorage.setItem('likes',JSON.stringify(this.likes))
  }

  readLocalStorage(){
    const storage = JSON.parse(localStorage.getItem('likes'));
    if(storage)
      this.likes = storage
  }


}


//SEARCH MODULE
const SearchModel = (function() {
  class Search {
    constructor(query) {
      this.query = query;
    }

    async scrapeResults() {
      try {
        let result;
        if(document.querySelector('.search_type_selection').value==='drink'){
         result = await fetch(`https://www.thecocktaildb.com/api/json/v1/1/search.php?s=${this.query}`);
        }
        else{
          result = await fetch(`https://www.thecocktaildb.com/api/json/v1/1/filter.php?i=${this.query}`);

        }
        this.results = await result.json();
        console.log(this.results);


      } catch (error) {
        alert("error processing drinks")
      }
    }
  }
  //public functions
  return {
    getSearchObject(newResults) {
      return new Search(newResults);
    }


  };

})();



//DOM INPUT MODULE
const DOMElements = (function() {
  //public functions
  return {
    getInput: () => {
      return {
        searchForm: document.querySelector('.search'),
        searchInput: document.querySelector('.search_field'),
        searchResultList: document.querySelector('.results__list'),
        searchResults: document.querySelector('.search_results_panel'),
        searchResultsPages: document.querySelector('.results__pages'),
        recipe: document.querySelector('.recipe'),
        shopping: document.querySelector('.shopping_list'),
        likesMenu: document.querySelector('.likes__field'),
        likesList: document.querySelector('.likes__list')


      }
    },

    renderLoader: parent => {
      const loader = `
          <div class="loader">
            <svg>
              <use href="img/icons.svg#icon-cw></use>"
            </svg>
         `;
      parent.insertAdjacentHTML('afterbegin', loader)
    }

  }

})();








//VIEW MODULE
const searchView = (function() {

  //shortens titles
  const limitRecipeTitle = (title, limit = 17) => {
    const newTitle = [];
    if (title.length > limit) {
      title.split(' ').reduce((accumulator, current) => {
        if (accumulator + current.length <= limit) {
          newTitle.push(current)
        }
        return accumulator + current.length
      }, 0);

      // return the results
      return `${newTitle.join(' ')} ...`
    }
    return title
  }

  const renderRecipe = recipe => {
    console.log("fertoot")
    const markup = `
    <li>
        <a class="results__link results__link--active" href="#${recipe.idDrink}">
            <figure class="results__fig">
                <img src="${recipe.strDrinkThumb}" alt="${recipe.strDrink}">
            </figure>
            <div class="results__data">
                <h4 class="results__name">${limitRecipeTitle(recipe.strDrink)}</h4>
            </div>
        </a>
    </li>
    `;

    DOMElements.getInput().searchResultList.insertAdjacentHTML('beforeend', markup);

  }

  //type: prev or next
  /*function makeButton(page, type) {  return `
  <button class="btn-inline results__btn--${type}" data-goto=${type==='prev'?page-1:page+1}>
       <span>Page ${type==='prev'?page-1:page+1}</span>
   </button>`};*/


  const renderButtons = (page, numberOfResults, resultsPerPage) => {
    console.log("fert toot");
    const pagesTotal = Math.ceil(numberOfResults / resultsPerPage);
    let button = '';
    if (page === 1 && pagesTotal > 1) {
      //button to go to next page
      button = `
      <button class="btn-inline results__btn--next" data-goto=${page+1}>
           <span>Page ${page+1}</span>
       </button>`
    } else if (page < pagesTotal) {
      //both buttons in the middle
      button = `
      <button class="btn-inline results__btn--prev" data-goto=${page-1}>
           <span>Page ${page-1}</span>
       </button>
       <button class="btn-inline results__btn--next" data-goto=${page+1}>
            <span>Page ${page+1}</span>
        </button>`
    } else if (page === pagesTotal && pagesTotal > 1) {
      button = `
      <button class="btn-inline results__btn--prev" data-goto=${page-1}>
           <span>Page ${page-1}</span>
      </button>`

    }

    DOMElements.getInput().searchResultsPages.insertAdjacentHTML('afterbegin', button)

  }
  //public functions
  return {

    getUserInput() {
      return DOMElements.getInput().searchInput.value;
    },

    renderResults: (recipes, page = 1, resultsPerPage = 10) => {
      console.log("shrek: Marry you")

      //render results per page
      const start = (page - 1) * resultsPerPage;
      const end = page * resultsPerPage;

      recipes.slice(start, end).forEach(renderRecipe);

      //render buttons
      //console.log("shrek: Marry you")
      renderButtons(page, recipes.length, resultsPerPage)
    },

    clearInput() {
      DOMElements.getInput().searchInput.value = ''
    },

    clearResults() {
      DOMElements.getInput().searchResultList.innerHTML = '';
      DOMElements.getInput().searchResultsPages.innerHTML = '';
    },

    highlightSelection: id => {
      document.querySelector(`a[href*="#${id}"]`).classList.add('result__link--active')
    }


  };



})();

const recipeView = (function() {

  const displayIngredient = ingredient => `<li class="recipe__item">
      <div class="recipe__count">${ingredient.count}</div>
      <div class="recipe__ingredient">
          <span class="recipe__unit">${ingredient.unit}</span>
          ${ingredient.ingredient}
      </div>
  </li>`

  return {
    clearRecipeView: () => {
      DOMElements.getInput().recipe.innerHTML = '';
    },

    renderRecipe: (recipe,isLiked) => {
      const markup = `<figure class="recipe__fig">
        <img src="${recipe.image}" alt="${recipe.title}" class="recipe__img">
        <h1 class="recipe__title">
            <span>${recipe.title}</span>
        </h1>
    </figure>
    <div class="recipe__details">
        <div class="recipe__info">
                <use href="img/icons.svg#icon-stopwatch"></use>
            <span class="recipe__info-data recipe__info-data--minutes">45</span>
            <span class="recipe__info-text"> minutes</span>
        </div>
        <div class="recipe__info">
                <use href="img/icons.svg#icon-man"></use>
            <span class="recipe__info-data recipe__info-data--people">${recipe.servings}</span>
            <span class="recipe__info-text"> servings</span>

            <div class="recipe__info-buttons">
                <button class="btn-tiny btn-decrease">
                        <h3>-</h3>
                </button>
                <button class="btn-tiny btn-increase">
                <h3>+</h3>

                </button>
            </div>

        </div>
        <button class="recipe__love like-button">
          ${isLiked? '<i class="material-icons is-liked bouncy">favorite</i>' : '<i class="material-icons not-liked bouncy">favorite_border</i>' }
        <span class="like-overlay"></span>

        </button>
    </div>



    <div class="recipe__ingredients">
        <ul class="recipe__ingredient-list">
          ${recipe.ingredients.map(ingredient => displayIngredient(ingredient)).join('')}

        </ul>

        <button class="btn-small recipe__btn recipe__btn--add">
            <span>Add to shopping list</span>
        </button>
    </div>

    <div class="recipe__directions">
        <h2 class="heading-2">How to make it</h2>
        <p class="recipe__directions-text">
            ${recipe.instructions}
        </p>

    </div>`;

      DOMElements.getInput().recipe.insertAdjacentHTML('afterbegin', markup);
    },

    updateServingsAndCounts: recipe => {
      //update servings
      document.querySelector('.recipe__info-data--people').textContent = recipe.servings

      //update ingredient counts
      const ingredientsCount = Array.from(document.querySelectorAll('.recipe__count'));
      ingredientsCount.forEach((item, i) => {
        item.textContent = recipe.ingredients[i].count
      });

    }
  };
})()

//shoppinglistview
const shoppingListView = (function() {
  return {
    displayItem: item => {
      const markup = `  <li class="shopping__item" data-itemid=${item.id}>
            <div class="shopping__count">
                <input type="number" value="${item.count}" step="${item.count}" class="shopping__count-value">
                <p>${item.unit}</p>
            </div>
            <p class="shopping__description">${item.ingredient}</p>
            <i class="shopping__delete fa fa-trash-o" style=" font-size:20px">
            </i>
        </li>

`;

    DOMElements.getInput().shopping.insertAdjacentHTML('beforeend',markup)},

    deleteItem: id => {
      const item = document.querySelector(`[data-itemid="${id}"]`);
      if(item) item.parentElement.removeChild(item);

    }
  }
})();

const likesView = (function(){
  return{
    toggleLikeButton: isLiked=>{
      const likeIcon = isLiked? `<i class="material-icons is-liked bouncy">favorite</i>`: `    <i class="material-icons not-liked bouncy">favorite_border</i>
`
      document.querySelector('.recipe__love').innerHTML = likeIcon;
    },

    toggleLikeMenu: likesSize =>{
      DOMElements.getInput().likesMenu.style.visibility = likesSize>0 ? 'visible': 'hidden';
    },

    displayLikesList: like=>{
      const markup = `<li>
          <a class="likes__link" href="#${like.id}">
              <figure class="likes__fig">
                  <img src="${like.image}" alt="Test">
              </figure>
              <div class="likes__data">
                  <h4 class="likes__name">${like.title}</h4>
              </div>
          </a>
      </li>`;


    DOMElements.getInput().likesList.insertAdjacentHTML('beforeend', markup);
  },

  deleteLike: id=>{
    const likeElement = document.querySelector(`.likes__link[href*="${id}"]`).parentElement;
    if(likeElement)
      likeElement.parentElement.removeChild(likeElement)
  }

  };
})();



//CONTROLLER MODULE
const controller = (function() {
  const state = {}
  /**
   * - Search object
   * - Current recipe object
   * - Shopping list object
   * - Liked recipes
   */
  const inputQuery = async () => {
    //1) retrieve query from view

    console.log(document.querySelector('.search_type_selection').value);
    const query = searchView.getUserInput();
    console.log(query);
    if (query) {
      //2) get new search object  and add it to state
      state.search = SearchModel.getSearchObject(query);
      //3) Prep UI for results
      searchView.clearInput()
      searchView.clearResults();
      //  DOMElements.renderLoader(DOMElements.getInput().searchResults);
      try {
        //4) Search for recipes
        await state.search.scrapeResults();

        // 5) Display results on UI
        searchView.renderResults(state.search.results.drinks);
        //console.log(state.search.results)
      } catch (error) {
        alert(error)
      }
    }
  }

  DOMElements.getInput().searchForm.addEventListener('submit', event => {

    event.preventDefault();
    inputQuery();
  });

  DOMElements.getInput().searchResultsPages.addEventListener('click', event => {
    const btn = event.target.closest('.btn-inline');
    if (btn) {
      const goToPage = parseInt(btn.dataset.goto, 10);
      searchView.clearResults();
      searchView.renderResults(state.search.results.drinks, goToPage)
    }
  });

  DOMElements.getInput().recipe.addEventListener('click', event => {
    if (event.target.matches('.btn-decrease, .btn-decrease *')) {
      if (state.recipe.servings > 1) {
        state.recipe.updateServings('decrease');
        recipeView.updateServingsAndCounts(state.recipe);
      }
    } else if (event.target.matches('.btn-increase, .btn-increase *')) {
      state.recipe.updateServings('increase');
      recipeView.updateServingsAndCounts(state.recipe);
    } else if (event.target.matches('.recipe__btn--add, .recipe__btn--add *')){
      controlShoppingList();
    } else if(event.target.matches('.recipe__love, .recipe__love *')){
      likesController();
    }
  });
  //recipe controller
  const controlRecipe = async () => {
    //extract ID from url
    const id = window.location.hash.replace('#', '');
    console.log(id)
    if (id) {
      //prep UI for changes
      recipeView.clearRecipeView();

      //highlight the selected results__btn
      //if (state.search)
      //  searchView.highlightSelection(id)

      //create new recipe
      try {
        state.recipe = new Recipe(id);
        //get recipe data
        await state.recipe.getRecipe();
        state.recipe.parseIngredients();
        // calculate servings
        state.recipe.calcServings();

        //render recipes
        console.log(state.recipe)
        recipeView.renderRecipe(state.recipe,
                                state.likes.isLiked(id));

      } catch (error) {
        alert("Error extracting recipe")
      }
    }
  }

  ['hashchange', 'load'].forEach(event => window.addEventListener(event, controlRecipe));


//Shopping List Controller
const controlShoppingList = ()=> {
  //create a new list if null
  if(!state.shoppinglist) state.shoppinglist = new ShoppingList();

  //add each ingredient to the shopping list view
  state.recipe.ingredients.forEach(currentIngredient=> {
    const item = state.shoppinglist.addItem(currentIngredient.count, currentIngredient.unit, currentIngredient.ingredient)
    shoppingListView.displayItem(item);
  });

  //Handle delete and update list item events
  DOMElements.getInput().shopping.addEventListener('click', event=>{
    const id = event.target.closest('.shopping__item').dataset.itemid;
    //handle delete method
    if(event.target.matches('.shopping__delete, .shopping__delete *')){
      //delete item from state
      state.shoppinglist.deleteItem(id);
      //delete item from user interface
      shoppingListView.deleteItem(id);
    }
    else if(event.target.matches('.shopping__count-value')){
      const newCount = parseFloat(event.target.value)
      state.shoppinglist.updateCount(id, newCount)
    }

  })
}


// Likes Controller
const likesController = ()=>{
  if(!state.likes) state.likes = new LikesList();
  const currentId = state.recipe.id;

  if(!state.likes.isLiked(currentId)){
    //if user hasnt liked the recipe
    const newLike = state.likes.addLikes(
      currentId,
      state.recipe.title,
      state.recipe.image
    );

    //toggle like button
    likesView.toggleLikeButton(true);

    //add it to the UI list
    likesView.displayLikesList(newLike)
    console.log(state.likes)

  }else{
    //remove like from state
    state.likes.deleteLikes(currentId);

    //toggle the like button
    likesView.toggleLikeButton(false);


    // remove the ui list
    likesView.deleteLike(currentId);
    console.log(state.likes)
  }
  likesView.toggleLikeMenu(state.likes.getLikesLength())
}

//restore liked recipes on load
window.addEventListener('load', ()=>{
  state.likes = new LikesList();
  state.likes.readLocalStorage();
  likesView.toggleLikeMenu(state.likes.getLikesLength());
  state.likes.likes.forEach(like => likesView.displayLikesList(like));

})

//public functions
return {

};

})();
