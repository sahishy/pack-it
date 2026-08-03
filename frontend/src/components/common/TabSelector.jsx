import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'

const TabSelector = ({ tabs = [], value, onChange, className = '' }) => (
    <Tabs value={value} onValueChange={onChange} className={className}>
        <TabsList className='grid w-full' style={{ gridTemplateColumns: `repeat(${tabs.length || 1}, minmax(0, 1fr))` }}>
            {tabs.map((tab) => (
                <TabsTrigger key={tab.value} value={tab.value}>
                    {tab.component}
                </TabsTrigger>
            ))}
        </TabsList>
    </Tabs>
)

export default TabSelector
