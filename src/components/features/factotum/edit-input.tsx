import { Check, Pencil } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useEffect, useState } from "react";
import { useFactotum } from "@/providers/factotum-provider";

export default function EditInput({
  value,
  path,
  onChange,
  label,
}: {
  value: string;
  path: string;
  label: string;
  onChange: (id: string, value: string, path: string) => void;
}) {
  const id = useFactotum().server;

  const Edit = async () => {
    onChange(id, path, inputValue);
  };

  const [isEditing, setIsEditing] = useState(false);
  const [inputValue, setInputValue] = useState(value);

  useEffect(() => {
    setInputValue(value);
  }, [value]);

  return (
    <div className="mb-4">
      <p className="mb-1 font-bold text-black text-sm">{label}</p>
      <div className="relative flex items-center">
        <Input
          id={path}
          className="border-2 border-gray-300 text-black focus-visible:border-gray-300"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          disabled={!isEditing}
        />
        {isEditing ? (
          <Check
            className="absolute right-2 h-5 w-5 cursor-pointer text-green-500"
            onClick={() => {
              setIsEditing(false);
              Edit();
            }}
          />
        ) : (
          <Pencil
            className="absolute right-2 h-5 w-5 cursor-pointer text-gray-500"
            onClick={() => setIsEditing(true)}
          />
        )}
      </div>
    </div>
  );
}
