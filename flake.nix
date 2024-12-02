{
  description = "A very basic flake";

  inputs = {
    nixpkgs.url = "github:nixos/nixpkgs/nixpkgs-unstable";
    ags.url = "github:aylur/ags";
  };

  outputs = { self, nixpkgs, ags }: let
    system = "x86_64-linux";
    pkgs = nixpkgs.legacyPackages.${system};

    agspkgs = ags.packages.${system};
    extraPackages = with agspkgs; [
      astal3
      hyprland
      mpris
      battery
      wireplumber
      network
      tray
    ];
  in {
    packages.${system}.default = ags.lib.bundle {
      inherit pkgs;
      src = ./.;
      name = "my-shell";
      entry = "app.ts";

      inherit extraPackages;
    };
  
    devShells.${system}.default = pkgs.mkShell {
      buildInputs = with pkgs; [
       (agspkgs.default.override { 
          inherit extraPackages;
        })

        typescript-language-server
      ];
    };
  };
}
