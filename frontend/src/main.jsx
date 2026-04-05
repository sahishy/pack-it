import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import './index.css'
import App from './App.jsx'
import { AuthProvider } from './contexts/AuthContext.jsx'
import { TripsProvider } from './contexts/TripsContext.jsx'
import { ItemsProvider } from './contexts/ItemsContext.jsx'
import { PlansProvider } from './contexts/PlansContext.jsx'
import { SuitcasesProvider } from './contexts/SuitcasesContext.jsx'

createRoot(document.getElementById('root')).render(
	<StrictMode>
		<BrowserRouter>
			<AuthProvider>
				<TripsProvider>
					<SuitcasesProvider>
						<ItemsProvider>
							<PlansProvider>
								<App />
							</PlansProvider>
						</ItemsProvider>
					</SuitcasesProvider>
				</TripsProvider>
			</AuthProvider>
		</BrowserRouter>
	</StrictMode>,
)
