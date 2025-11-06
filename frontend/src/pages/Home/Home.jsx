import axios from 'axios'
import React, { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import {
	LuAward,
	LuCake,
	LuChefHat,
	LuMapPin,
	LuShoppingCart,
	LuStar,
	LuTrendingUp,
	LuUsers,
} from 'react-icons/lu'
import { MdAccessTime, MdFavorite, MdFavoriteBorder } from 'react-icons/md'
import { Link, useNavigate } from 'react-router-dom'
import { useCartStore } from '../../store/Cart'
import { useProductStore } from '../../store/Product'
import { useUserStore } from '../../store/User'
import './Home.scss'
import { FaStar, FaUser } from "react-icons/fa6";
import photo1 from '../../assets/photo_1_2025-10-02_23-08-39.jpg'
import photo2 from '../../assets/photo_2_2025-10-02_23-08-39.jpg'
import photo3 from '../../assets/photo_2025-10-02_23-09-03.jpg'
import photo4 from '../../assets/photo_2_2025-10-02_23-08-56.jpg'
import photo5 from '../../assets/photo_1_2025-10-02_23-08-56.jpg'
import photo6 from '../../assets/photo_2_2025-10-04_21-54-10.jpg'

// About gallery images array
const aboutImages = [
	{ src: photo1, alt: 'Professional baker decorating cake' },
	{ src: photo2, alt: 'Beautiful custom wedding cake' },
	{ src: photo3, alt: 'Colorful birthday cake collection' },
	{ src: photo4, alt: "Baker's workspace with ingredients" },
	{ src: photo5, alt: 'Colorful birthday cake collection' },
	{ src: photo6, alt: "Baker's workspace with ingredients" }
]

import { useTranslation } from 'react-i18next';
const API_URL = import.meta.env.VITE_API_URL;

const Home = () => {
	const { t } = useTranslation();
	const [bakers, setBakers] = useState([])
	const [loading, setLoading] = useState(true)
	const [error, setError] = useState(null)
	const [favorites, setFavorites] = useState(new Set())
	const [selectedImageIndex, setSelectedImageIndex] = useState(null)
	const { fetchProducts, products } = useProductStore()

	useEffect(() => {
		const fetchBakers = async () => {
			try {
				const res = await axios.get(`${API_URL}/api/auth/bakers`)
				setBakers(res.data)
				setLoading(false)
			} catch (err) {
				console.error('Error fetching bakers:', err)
				setError('Failed to load bakers.')
				setLoading(false)
			}
		}

		fetchBakers()
	}, [])

	useEffect(() => {
		fetchProducts()
	}, [fetchProducts])

	// Handle keyboard navigation for image modal
	useEffect(() => {
		const handleKeyDown = (e) => {
			if (selectedImageIndex === null) return

			switch (e.key) {
				case 'Escape':
					setSelectedImageIndex(null)
					break
				case 'ArrowLeft':
					setSelectedImageIndex(prev => 
						prev > 0 ? prev - 1 : aboutImages.length - 1
					)
					break
				case 'ArrowRight':
					setSelectedImageIndex(prev => 
						prev < aboutImages.length - 1 ? prev + 1 : 0
					)
					break
			}
		}

		if (selectedImageIndex !== null) {
			document.addEventListener('keydown', handleKeyDown)
		}

		return () => {
			document.removeEventListener('keydown', handleKeyDown)
		}
	}, [selectedImageIndex])

	const toggleFavorite = id => {
		setFavorites(prev => {
			const newFavorites = new Set(prev)
			if (newFavorites.has(id)) {
				newFavorites.delete(id)
			} else {
				newFavorites.add(id)
			}
			return newFavorites
		})
	}

	const ProductCard = ({ product }) => {
		const navigate = useNavigate()
		const { user, token } = useUserStore()
		const { addToCart, isInCart, getCartItemQuantity } = useCartStore()
		const [isAdding, setIsAdding] = useState(false)

		const itemInCart = isInCart(product._id)
		const cartQuantity = getCartItemQuantity(product._id)

		const handleAddToCart = async e => {
			e.stopPropagation()
			if (!user || !token) return toast.error('Please log in to add to cart.')

			setIsAdding(true)

			try {
				await addToCart(product, token, 1)
				toast.success(`${product.name} added to cart ✅`)
			} catch (error) {
				console.error('Cart operation failed:', error)
				toast.error('Failed to add to cart')
			} finally {
				setIsAdding(false)
			}
		}

		const imageUrl = product?.image?.startsWith('http')
			? product.image
			: `${import.meta.env.VITE_BACKEND_BASE_URL}${product?.image || '/placeholder.png'}`

			const renderStars = (rating) => {
        const filledStars = Math.floor(rating);
        const stars = [];
        for (let i = 0; i < 5; i++) {
            if (i < filledStars) {
                stars.push(<LuStar key={i} className='filled' />);
            } else {
                stars.push(<LuStar key={i} className='empty' />);
            }
        }
        return stars;
    };

		return (
			<div className='product-card'>
				<div className='card-image'>
					<img src={imageUrl} alt={product.name} />
					<button
						className={`favorite-btn ${
							favorites.has(product._id) ? 'active' : ''
						}`}
						onClick={() => toggleFavorite(product._id)}
					>
						{favorites.has(product._id) ? <MdFavorite /> : <MdFavoriteBorder />}
					</button>
				</div>
				<div className='card-content'>
					<div className='card-header'>
						<h3>{product.name}</h3>
						<div className='baker-info'>
							By <span>{product.baker?.name || 'Professional Baker'}</span>
						</div>
					</div>
					<div className='rating'>
                    <FaStar /> {product.rating?.average ? product.rating.average.toFixed(1) : '0.0'} ({product.reviewCount || 0} reviews)
                </div>
					<div className='price'>
						{product.price} UZS
						{product.originalPrice && <span>{product.originalPrice} UZS</span>}
					</div>
					<div className='card-actions'>
						<div className='primary-actions'>
							<button
								onClick={handleAddToCart}
								className={`add-to-cart ${itemInCart ? 'added' : ''}`}
								disabled={isAdding}
							>
								<LuShoppingCart />
								{isAdding
									? 'Processing...'
									: itemInCart
									? `Added (${cartQuantity}) `
									: 'Add to cart'}
							</button>
							<button
								className='buy-now'
								onClick={() => navigate(`/product/${product._id}`)}
							>
								Buy Now
							</button>
						</div>
						<Link to={`/cakes/${product._id}`} className='customize'>
							Customize
						</Link>
					</div>
				</div>
			</div>
		)
	}

	const BakerCardComponent = ({ baker }) => (
		<div className='baker-card'>
			<div className='baker-header'>
				<div className='baker-avatar'>
					{baker.image && !baker.image.includes('default.png') ? (
						<img
							src={`${import.meta.env.VITE_BACKEND_BASE_URL}${baker.image}`}
							alt={baker.bakeryName || baker.name}
						/>
					) : (
						<div className='specialist-initials-container'>
							<div className='specialist-initials-home'>
								{baker.bakeryName?.charAt(0) || baker.name?.charAt(0) || 'B'}
							</div>
						</div>
					)}
				</div>
				<div className='baker-info'>
					<h3>{baker.bakeryName || 'Sweet Dreams Bakery'}</h3>
					<div className='baker-name'>{baker.name}</div>
				</div>
				<button
					className={`favorite-btn ${favorites.has(baker._id) ? 'active' : ''}`}
					onClick={() => toggleFavorite(baker._id)}
				>
					{favorites.has(baker._id) ? <MdFavorite /> : <MdFavoriteBorder />}
				</button>
			</div>
			<div className='baker-details'>
				<div className='rating'>
					<FaStar /> {baker.rating?.average ? baker.rating.average.toFixed(1) : '0.0'} ({baker.reviewCount || 0} reviews)
				</div>
				<div className='location'>
					<LuMapPin />
					<span>{baker.location || 'Downtown, City'}</span>
				</div>
				<div className='hashtags'>
					{(
						baker.specialties || ['Custom Cakes', 'Wedding Cakes', 'Cupcakes']
					).map((tag, index) => (
						<span key={index} className='hashtag'>
							#{tag}
						</span>
					))}
				</div>
				<div
					className={`availability ${
						baker.available === false ? 'unavailable' : ''
					}`}
				>
					{baker.available !== false ? 'Available Now' : 'Busy'}
				</div>
			</div>
			<div className='baker-actions'>
				                <Link to={`/bakers/${baker._id}`}>
				                    <button className='view-profile'>View Profile</button>
				                </Link>				<Link to='/custom'></Link>
			</div>
		</div>
	)

	return (
		<>
			{/* Hero Section - Promotions & Intro */}
			<div className='hero'>
				<div className='container'>
					<h1>{t('home_hero_title')}</h1>
					<p>
						{t('home_hero_subtitle')}
					</p>
					<div className='btns'>
						<Link to='/custom'>
							<button>
								<LuCake /> {t('home_build_custom_cake')}
							</button>
						</Link>
						<Link to='/cakes'>
							<button>{t('home_browse_ready_made')}</button>
						</Link>
					</div>
				</div>
			</div>

			{/* Popular Cakes Section */}
			<section className='cakes'>
				<div className='container'>
					<div className='top'>
						<h2>{t('home_popular_cakes')}</h2>
						<Link to={'/cakes'} className='viewAll'>
							{t('home_view_all_cakes')}
						</Link>
					</div>

					<div className='product_cards'>
						{products && products.length > 0 ? (
							products
								.slice(0, 6)
								.map(product => (
									<ProductCard key={product._id} product={product} />
								))
						) : (
							<div className='loading-grid'>
								{[...Array(6)].map((_, i) => (
									<div key={i} className='product-card loading'>
										<div className='card-image skeleton'></div>
										<div className='card-content'>
											<div className='skeleton-text'></div>
											<div className='skeleton-text short'></div>
										</div>
									</div>
								))}
							</div>
						)}
					</div>
				</div>
			</section>

			{/* Constructor Section */}
			<section className='constructor-section'>
				<div className='container'>
					<h2>{t('home_constructor_title')}</h2>
					<p>
						{t('home_constructor_subtitle')}
					</p>
					<Link to='/cakes' className='constructor-link'>
						<LuCake />
							{t('home_start_building')}
					</Link>
				</div>
			</section>

			{/* Featured Bakers Section */}
			<section className='bakers_home'>
				<div className='container'>
					<div className='top'>
						<h2>{t('home_featured_bakers')}</h2>
						<Link to={'/bakers'} className='viewAll'>
							{t('home_view_all_bakers')}
						</Link>
					</div>

					<div className='list_bakers'>
						{loading && (
							<div className='bakers-list'>
								{[...Array(6)].map((_, i) => (
									<div key={i} className='baker-card loading'>
										<div className='baker-header'>
											<div className='baker-avatar skeleton'></div>
											<div className='baker-info'>
												<div className='skeleton-text'></div>
												<div className='skeleton-text short'></div>
											</div>
										</div>
									</div>
								))}
							</div>
						)}
						{error && (
							<p style={{ color: 'red', textAlign: 'center' }}>{error}</p>
						)}
						<div className='bakers-list'>
							{bakers.slice(0, 6).map((baker, index) => (
								<BakerCardComponent key={baker._id || index} baker={baker} />
							))}
						</div>
					</div>
				</div>
			</section>

			{/* About Section */}
			<section className='about-section'>
				<div className='container'>
					<h2>{t('home_about_title')}</h2>
					<p className='intro-text'>
						{t('home_about_subtitle')}
					</p>

					<div className='about-images'>
						{aboutImages.map((image, index) => (
							<div 
								key={index}
								className='about-image' 
								onClick={() => setSelectedImageIndex(index)}
							>
								<img
									src={image.src}
									alt={image.alt}
								/>
								<div className='image-overlay'>
									<span className='zoom-icon'>🔍</span>
								</div>
							</div>
						))}
					</div>
				</div>
			</section>

			{/* Why Choose Us Section */}
			<section className='why'>
				<div className='container'>
					<h2>{t('home_why_choose_title')}</h2>
					<p className='context'>
						{t('home_why_choose_subtitle')}
					</p>

					<div className='features'>
						<div className='feature'>
							<div className='img'>
								<LuChefHat />
							</div>
							<h3>{t('home_feature_expert_bakers_title')}</h3>
							<p>
								{t('home_feature_expert_bakers_subtitle')}
							</p>
						</div>
						<div className='feature'>
							<div className='img'>
								<LuCake />
							</div>
							<h3>{t('home_feature_custom_designs_title')}</h3>
							<p>
								{t('home_feature_custom_designs_subtitle')}
							</p>
						</div>
						<div className='feature'>
							<div className='img'>
								<MdAccessTime />
							</div>
							<h3>{t('home_feature_real_time_tracking_title')}</h3>
							<p>
								{t('home_feature_real_time_tracking_subtitle')}
							</p>
						</div>
						<div className='feature'>
							<div className='img'>
								<LuUsers />
							</div>
							<h3>{t('home_feature_community_focused_title')}</h3>
							<p>
								{t('home_feature_community_focused_subtitle')}
							</p>
						</div>
						<div className='feature'>
							<div className='img'>
								<LuAward />
							</div>
							<h3>{t('home_feature_quality_guaranteed_title')}</h3>
							<p>
								{t('home_feature_quality_guaranteed_subtitle')}
							</p>
						</div>
						<div className='feature'>
							<div className='img'>
								<LuTrendingUp />
							</div>
							<h3>{t('home_feature_competitive_pricing_title')}</h3>
							<p>
								{t('home_feature_competitive_pricing_subtitle')}
							</p>
						</div>
					</div>
				</div>
			</section>

			{/* Image Modal */}
			{selectedImageIndex !== null && (
				<div className="image-modal" onClick={() => setSelectedImageIndex(null)}>
					<div className="modal-content" onClick={e => e.stopPropagation()}>
						<button className="modal-close" onClick={() => setSelectedImageIndex(null)}>
							×
						</button>
						
						{/* Navigation Arrows */}
						<button 
							className="modal-nav modal-prev"
							onClick={() => setSelectedImageIndex(prev => 
								prev > 0 ? prev - 1 : aboutImages.length - 1
							)}
						>
							‹
						</button>
						
						<button 
							className="modal-nav modal-next"
							onClick={() => setSelectedImageIndex(prev => 
								prev < aboutImages.length - 1 ? prev + 1 : 0
							)}
						>
							›
						</button>

						<img 
							src={aboutImages[selectedImageIndex].src} 
							alt={aboutImages[selectedImageIndex].alt} 
							className="modal-image" 
						/>
						
						<div className="modal-caption">
							{aboutImages[selectedImageIndex].alt}
						</div>
						
						{/* Image counter */}
						<div className="modal-counter">
							{selectedImageIndex + 1} / {aboutImages.length}
						</div>
					</div>
				</div>
			)}
		</>
	)
}

export default Home