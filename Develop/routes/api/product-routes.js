const router = require('express').Router()
const { Product, Category, Tag, ProductTag } = require('../../models')

// The `/api/products` endpoint

// get all products
router.get('/', async (req, res) => {
  //TODO : find all products
  //TODO : be sure to include its associated Category and Tag data
  try {
    const productDbData = await Product.findAll({
      attributes: ['id', 'product_name', 'price', 'stock'],
      include: [
        {
          model: Category,
          attributes: ['category_name'],
        },
        {
          model: Category,
          attributes: ['category_name'],
        },
      ],
    })
    if (!productDbData) {
      res.status(400).json('No products were found')
      return
    } else if (productDbData) {
      res.json(productDbData)
    }
  } catch (err) {
    console.log(err)
  }
})

// get one product
router.get('/:id', async (req, res) => {
  //Todo : find a single product by its `id`
  //Todo : be sure to include its associated Category and Tag data
  try {
    const productDbData = await Product.findOne({
      where: { id: req.params.id },
      attributes: ['id', 'product_name', 'price', 'stock'],
      include: [
        {
          model: Category,
          attributes: ['category_name'],
        },
        {
          model: Tag,
          attributes: ['tag_name'],
        },
      ],
    })
    console.log(productDbData)

    if (!productDbData) {
      res.status(400).json('No products were found with that id.')
    }
    res.status(200).json(productDbData)
  } catch (err) {
    console.log(err)
  }
})

// create new product
router.post('/', (req, res) => {
  Product.create({
    product_name: req.body.product_name,
    price: req.body.price,
    stock: req.body.stock,
    category_id: req.body.category_id,
    tagIds: req.body.tagIds,
  })
    .then((product) => {
      // if there's product tags, we need to create pairings to bulk create in the ProductTag model
      if (req.body.tagIds.length) {
        const productTagIdArr = req.body.tagIds.map((tag_id) => {
          return {
            product_id: product.id,
            tag_id,
          }
        })
        return ProductTag.bulkCreate(productTagIdArr)
      }
      // if no product tags, just respond
      res.status(200).json(product)
    })
    .then((productTagIds) => res.status(200).json(productTagIds))
    .catch((err) => {
      console.log(err)
      res.status(400).json(err)
    })
})

// update product
router.put('/:id', (req, res) => {
  // update product data
  Product.update(req.body, {
    where: {
      id: req.params.id,
    },
  })
    .then((product) => {
      // find all associated tags from ProductTag
      return ProductTag.findAll({ where: { product_id: req.params.id } })
    })
    .then((productTags) => {
      // get list of current tag_ids
      const productTagIds = productTags.map(({ tag_id }) => tag_id)
      // create filtered list of new tag_ids
      const newProductTags = req.body.tagIds
        .filter((tag_id) => !productTagIds.includes(tag_id))
        .map((tag_id) => {
          return {
            product_id: req.params.id,
            tag_id,
          }
        })
      // figure out which ones to remove
      const productTagsToRemove = productTags
        .filter(({ tag_id }) => !req.body.tagIds.includes(tag_id))
        .map(({ id }) => id)

      // run both actions
      return Promise.all([
        ProductTag.destroy({ where: { id: productTagsToRemove } }),
        ProductTag.bulkCreate(newProductTags),
      ])
    })
    .then((updatedProductTags) => res.json(updatedProductTags))
    .catch((err) => {
      // console.log(err);
      res.status(400).json(err)
    })
})

router.delete('/:id', async (req, res) => {
  // delete one product by its `id` value
  const deleteProductDbData = await Product.destroy({
    where: { id: req.params.id },
  })
  if (!deleteProductDbData) {
    res.status(400).json('No products were found with that id.')
  } else if (deleteProductDbData) {
    res.status(200).json(`records with ${req.params.id} destroyed`)
  }
})

module.exports = router
