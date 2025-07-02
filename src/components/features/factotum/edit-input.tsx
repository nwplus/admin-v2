
import { Check, Pencil } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useEffect, useState } from "react";
import { useFactotum } from "@/providers/factotum-provider";

export default function EditInput({value, path, onChange, label}: {value: string, path:string, label:string, onChange: (id: string, value: string, path: string) => void}) {
    const id = useFactotum().server;
    
    const Edit = async () => {
        onChange(id, path, inputValue)
    }

    const [isEditing, setIsEditing] = useState(false);
    const [inputValue, setInputValue] = useState(value)

    useEffect(() => {
        setInputValue(value)
    }, [value])
    
    return (
        <div className="mb-4">
                    <p className="text-black text-sm font-bold mb-1">{label}</p>
                    <div className="flex relative items-center">
                        <Input 
                            id={path}
                            className="text-black border-2 border-gray-300 focus-visible:border-gray-300"  
                            value={inputValue} 
                            onChange={(e) => setInputValue(e.target.value)}
                            disabled={!isEditing}
                        />
                        {isEditing ? (
                            <Check 
                                className="w-5 h-5 cursor-pointer text-green-500 absolute right-2" 
                                onClick={() => {
                                    setIsEditing(false);
                                    Edit()
                                }} 
                            />
                        ) : (
                            <Pencil
                                className="w-5 h-5 cursor-pointer absolute right-2 text-gray-500" 
                                onClick={() => setIsEditing(true)}
                            />
                        )}
                    </div>
        </div>
    )
}