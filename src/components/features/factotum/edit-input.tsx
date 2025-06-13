
import { Check, Pencil } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useState } from "react";


export default function EditInput({value, label, onChange}: {value: string, label: string, onChange: (value: string) => void}) {


    const [isEditing, setIsEditing] = useState(false);
    
    return (
        <div className="mb-4">
                    <p className="text-black text-sm font-bold mb-1">{label}</p>
                    <div className="flex relative items-center">
                        <Input 
                            id={label}
                            className="text-black border-2 border-gray-300 focus-visible:border-gray-300"  
                            value={value as string} 
                            onChange={(e) => onChange(e.target.value)} 
                            disabled={!isEditing}
                        />
                        {isEditing ? (
                            <Check 
                                className="w-5 h-5 cursor-pointer text-green-500 absolute right-2" 
                                onClick={() => {
                                    setIsEditing(false);
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