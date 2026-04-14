import * as React from "react";
import Select from "react-select";

type Utilisateur = {
    idUtilisateur: number;
    username: string;
    email: string;
    phonenumber?: string;
    role?: number;
    firstname?: string;
    lastname?: string;
    isreceivedrequete?: boolean;
};

interface ValidateurProps {
    value: number[];
    onChange: (value: number[]) => void;
    Validateurs: Utilisateur[];
}

export function SelectValidateur({ value, onChange, Validateurs }: ValidateurProps) {
    // Convert your Utilisateur list into react-select option format
    const options = Validateurs.map((v) => ({
        value: v.idUtilisateur,
        label: v.username,
    }));

    // Convert external selected IDs into react-select option format
    const selectedOptions = options.filter((opt) => value.includes(opt.value));

    const handleChange = (selected: any) => {
        const selectedIds = selected ? selected.map((s: any) => s.value) : [];
        onChange(selectedIds);
    };

    return (
        <div className="w-full">
            <Select
                isMulti
                options={options}
                value={selectedOptions}
                onChange={handleChange}
                placeholder="Liste des Validateurs"
                className="text-sm"
                classNamePrefix="react-select"
                noOptionsMessage={() => "Aucun validateur trouvé"}
                styles={{
                    control: (base) => ({
                        ...base,
                        borderColor: "#d1d5db", // Tailwind gray-300
                        minHeight: "2.5rem",
                    }),
                    multiValue: (base) => ({
                        ...base,
                        backgroundColor: "#e5e7eb", // gray-200
                    }),
                    option: (base, state) => ({
                        ...base,
                        backgroundColor: state.isFocused ? "#f3f4f6" : "white", // gray-100
                        color: "#111827", // gray-900
                    }),
                }}
            />
        </div>
    );
}
