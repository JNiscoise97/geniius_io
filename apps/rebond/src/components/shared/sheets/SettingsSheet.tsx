import { Settings } from 'lucide-react';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import ConfigurationPage from '@/features/configuration/Configuration';


export default function SettingsSheet() {

    return (
        <Sheet>
            <SheetTrigger asChild>
                <TooltipProvider>
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <SheetTrigger asChild>
                                <button className="p-2 rounded-full hover:bg-gray-200">
                                    <Settings className="w-5 h-5" />
                                </button>
                            </SheetTrigger>
                        </TooltipTrigger>
                        <TooltipContent side="bottom">
                            <p>Ouvrir les paramètres</p>
                        </TooltipContent>
                    </Tooltip>
                </TooltipProvider>
            </SheetTrigger>
            <SheetContent side="right" className="w-full sm:max-w-[800px]">
                <div className="mt-10 pr-10 pl-10">
                    <p className="text-sm text-muted-foreground mt-6 mb-2">
                        Paramètres.
                    </p>
                    <ConfigurationPage />
                </div>
            </SheetContent>
        </Sheet>
    );
}